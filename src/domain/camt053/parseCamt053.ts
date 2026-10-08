import { decodeUtf8 } from '../decode';
import { DomainError } from '../errors';
import { parseAmountToRappen } from '../money';
import type { Statement, Transaction } from '../types';
import { classifyBankTxCode } from './bankTxCode';
import {
  CAMT053_NAMESPACE_REGEX,
  rawStatementSchema,
  type RawEntry,
  type RawStatement,
} from './schema';

export interface Camt053ParseResult {
  msgId: string;
  namespace: string;
  statements: Statement[];
  transactions: Transaction[];
}

/** Blocks XXE and entity expansion before the text reaches any XML parser. */
export function assertNoDtd(text: string): void {
  if (/<!DOCTYPE/i.test(text) || /<!ENTITY/i.test(text)) {
    throw new DomainError('FILE_REJECTED', 'XML with DOCTYPE or ENTITY declarations is rejected');
  }
}

function children(el: Element, ns: string, name: string): Element[] {
  return Array.from(el.children).filter((c) => c.localName === name && c.namespaceURI === ns);
}

function at(el: Element | undefined, ns: string, path: string): Element | undefined {
  let current = el;
  for (const part of path.split('/')) {
    if (!current) return undefined;
    current = children(current, ns, part)[0];
  }
  return current;
}

function text(el: Element | undefined, ns: string, path: string): string {
  return at(el, ns, path)?.textContent?.trim() ?? '';
}

function readEntry(ntry: Element, ns: string): RawEntry {
  const amt = at(ntry, ns, 'Amt');
  const cdtDbtInd = text(ntry, ns, 'CdtDbtInd');
  const parties = at(ntry, ns, 'NtryDtls/TxDtls/RltdPties');
  // Credits name the debtor as counterparty, debits name the creditor.
  const role = cdtDbtInd === 'CRDT' ? 'Dbtr' : 'Cdtr';
  const country = text(parties, ns, `${role}/Pty/PstlAdr/Ctry`);
  const cpIban = text(parties, ns, `${role}Acct/Id/IBAN`);
  return {
    amount: amt?.textContent?.trim() ?? '',
    currency: amt?.getAttribute('Ccy') ?? '',
    cdtDbtInd: cdtDbtInd as RawEntry['cdtDbtInd'],
    status: text(ntry, ns, 'Sts/Cd') || text(ntry, ns, 'Sts'),
    bookingDate: text(ntry, ns, 'BookgDt/Dt') || text(ntry, ns, 'BookgDt/DtTm'),
    valueDate: text(ntry, ns, 'ValDt/Dt') || text(ntry, ns, 'ValDt/DtTm'),
    acctSvcrRef: text(ntry, ns, 'AcctSvcrRef'),
    domain: text(ntry, ns, 'BkTxCd/Domn/Cd'),
    family: text(ntry, ns, 'BkTxCd/Domn/Fmly/Cd'),
    subFamily: text(ntry, ns, 'BkTxCd/Domn/Fmly/SubFmlyCd'),
    counterpartyName: text(parties, ns, `${role}/Pty/Nm`),
    counterpartyCountry: country || null,
    counterpartyIban: cpIban || null,
    remittance: text(ntry, ns, 'NtryDtls/TxDtls/RmtInf/Ustrd'),
  };
}

function readStatement(stmt: Element, ns: string): RawStatement {
  return {
    id: text(stmt, ns, 'Id'),
    from: text(stmt, ns, 'FrToDt/FrDtTm'),
    to: text(stmt, ns, 'FrToDt/ToDtTm'),
    iban: text(stmt, ns, 'Acct/Id/IBAN'),
    currency: text(stmt, ns, 'Acct/Ccy'),
    ownerName: text(stmt, ns, 'Acct/Ownr/Nm'),
    bic: text(stmt, ns, 'Acct/Svcr/FinInstnId/BICFI'),
    balances: children(stmt, ns, 'Bal').map((bal) => {
      const amt = at(bal, ns, 'Amt');
      return {
        code: text(bal, ns, 'Tp/CdOrPrtry/Cd') as 'OPBD' | 'CLBD',
        amount: amt?.textContent?.trim() ?? '',
        currency: amt?.getAttribute('Ccy') ?? '',
        cdtDbtInd: text(bal, ns, 'CdtDbtInd') as 'CRDT' | 'DBIT',
        date: text(bal, ns, 'Dt/Dt') || text(bal, ns, 'Dt/DtTm'),
      };
    }),
    entries: children(stmt, ns, 'Ntry').map((n) => readEntry(n, ns)),
  };
}

const signed = (amount: string, ind: 'CRDT' | 'DBIT') =>
  (ind === 'DBIT' ? -1 : 1) * parseAmountToRappen(amount);

/** Parses one camt.053 file. Throws DomainError for fatal problems (encoding, DTD, namespace, schema). */
export function parseCamt053(input: string | Uint8Array, sourceFile: string): Camt053ParseResult {
  const xml = typeof input === 'string' ? input : decodeUtf8(input);
  assertNoDtd(xml);
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new DomainError('PARSE_ERROR', `${sourceFile}: XML is not well-formed`);
  }
  const root = doc.documentElement;
  const ns = root.namespaceURI ?? '';
  if (root.localName !== 'Document' || !CAMT053_NAMESPACE_REGEX.test(ns)) {
    throw new DomainError(
      'FILE_REJECTED',
      `${sourceFile}: not a camt.053 document (namespace "${ns}")`,
    );
  }
  const msgId = doc.getElementsByTagNameNS(ns, 'MsgId')[0]?.textContent?.trim() ?? '';
  const statements: Statement[] = [];
  const transactions: Transaction[] = [];

  for (const stmtEl of Array.from(doc.getElementsByTagNameNS(ns, 'Stmt'))) {
    const parsed = rawStatementSchema.safeParse(readStatement(stmtEl, ns));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new DomainError(
        'VALIDATION_ERROR',
        `${sourceFile}: ${issue?.path.join('.')} – ${issue?.message ?? 'invalid statement'}`,
      );
    }
    const s = parsed.data;
    const opening = s.balances.find((b) => b.code === 'OPBD');
    const closing = s.balances.find((b) => b.code === 'CLBD');
    if (!opening || !closing) {
      throw new DomainError('VALIDATION_ERROR', `${sourceFile}: statement ${s.id} lacks OPBD/CLBD`);
    }
    statements.push({
      id: s.id,
      msgId,
      iban: s.iban,
      currency: s.currency,
      ownerName: s.ownerName,
      bic: s.bic,
      from: s.from.slice(0, 10),
      to: s.to.slice(0, 10),
      openingBalance: signed(opening.amount, opening.cdtDbtInd),
      closingBalance: signed(closing.amount, closing.cdtDbtInd),
      openingDate: opening.date.slice(0, 10),
      closingDate: closing.date.slice(0, 10),
      entryCount: s.entries.length,
      sourceFile,
    });
    for (const e of s.entries) {
      const amount = parseAmountToRappen(e.amount);
      const bankTxCode = { domain: e.domain, family: e.family, subFamily: e.subFamily };
      transactions.push({
        id: `${s.iban}:${e.acctSvcrRef}`,
        statementId: s.id,
        iban: s.iban,
        clientId: null,
        bookingDate: e.bookingDate.slice(0, 10),
        valueDate: e.valueDate.slice(0, 10),
        amount,
        signed: e.cdtDbtInd === 'DBIT' ? -amount : amount,
        currency: e.currency,
        direction: e.cdtDbtInd,
        status: e.status,
        acctSvcrRef: e.acctSvcrRef,
        bankTxCode,
        kind: classifyBankTxCode(bankTxCode, e.cdtDbtInd),
        counterparty: {
          name: e.counterpartyName,
          country: e.counterpartyCountry,
          iban: e.counterpartyIban,
        },
        remittance: e.remittance,
        sourceFile,
      });
    }
  }
  return { msgId, namespace: ns, statements, transactions };
}
