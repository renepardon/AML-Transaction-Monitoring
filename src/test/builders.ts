import type { ClientProfile, Transaction } from '@/domain/types';

export interface FixtureEntry {
  amount: string;
  ind: 'CRDT' | 'DBIT';
  date: string;
  ref: string;
  family?: 'RCDT' | 'ICDT' | 'CNTR';
  sub?: 'DMCT' | 'CDPT';
  party?: string;
  country?: string;
  purpose?: string;
}

export interface FixtureStatement {
  id: string;
  iban: string;
  owner?: string;
  opening: string;
  closing: string;
  entries: FixtureEntry[];
}

function entryXml(e: FixtureEntry): string {
  const role = e.ind === 'CRDT' ? 'Dbtr' : 'Cdtr';
  const family = e.family ?? (e.ind === 'CRDT' ? 'RCDT' : 'ICDT');
  return `<Ntry><Amt Ccy="CHF">${e.amount}</Amt><CdtDbtInd>${e.ind}</CdtDbtInd><Sts><Cd>BOOK</Cd></Sts>
<BookgDt><Dt>${e.date}</Dt></BookgDt><ValDt><Dt>${e.date}</Dt></ValDt><AcctSvcrRef>${e.ref}</AcctSvcrRef>
<BkTxCd><Domn><Cd>PMNT</Cd><Fmly><Cd>${family}</Cd><SubFmlyCd>${e.sub ?? 'DMCT'}</SubFmlyCd></Fmly></Domn></BkTxCd>
<NtryDtls><TxDtls><RltdPties><${role}><Pty><Nm>${e.party ?? 'Counterparty AG'}</Nm><PstlAdr><Ctry>${e.country ?? 'CH'}</Ctry></PstlAdr></Pty></${role}></RltdPties>
<RmtInf><Ustrd>${e.purpose ?? 'Payment'}</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry>`;
}

function balXml(code: string, amount: string, date: string): string {
  return `<Bal><Tp><CdOrPrtry><Cd>${code}</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">${amount}</Amt><CdtDbtInd>CRDT</CdtDbtInd><Dt><Dt>${date}</Dt></Dt></Bal>`;
}

/** Builds a tiny, valid camt.053.001.08 document. */
export function camtXml(
  statements: FixtureStatement[],
  ns = 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.08',
): string {
  const stmts = statements
    .map(
      (
        s,
      ) => `<Stmt><Id>${s.id}</Id><FrToDt><FrDtTm>2026-07-01T00:00:00</FrDtTm><ToDtTm>2026-07-31T23:59:59</ToDtTm></FrToDt>
<Acct><Id><IBAN>${s.iban}</IBAN></Id><Ccy>CHF</Ccy><Ownr><Nm>${s.owner ?? 'Test Owner'}</Nm></Ownr><Svcr><FinInstnId><BICFI>ZSEECH22XXX</BICFI></FinInstnId></Svcr></Acct>
${balXml('OPBD', s.opening, '2026-07-01')}${balXml('CLBD', s.closing, '2026-07-31')}
${s.entries.map(entryXml).join('\n')}</Stmt>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="${ns}"><BkToCstmrStmt><GrpHdr><MsgId>TEST-1</MsgId><CreDtTm>2026-07-31T23:59:00</CreDtTm></GrpHdr>
${stmts}</BkToCstmrStmt></Document>`;
}

export const TEST_IBAN = 'CH3208146000100100001';

let txSeq = 0;

export function buildTx(overrides: Partial<Transaction> & { amount: number }): Transaction {
  txSeq += 1;
  const direction = overrides.direction ?? 'CRDT';
  const ref = overrides.acctSvcrRef ?? `REF${txSeq}`;
  const iban = overrides.iban ?? TEST_IBAN;
  return {
    id: `${iban}:${ref}`,
    statementId: 'C9999-202607',
    iban,
    clientId: 'C9999',
    bookingDate: '2026-07-01',
    valueDate: overrides.bookingDate ?? '2026-07-01',
    signed: direction === 'DBIT' ? -overrides.amount : overrides.amount,
    currency: 'CHF',
    direction,
    status: 'BOOK',
    acctSvcrRef: ref,
    bankTxCode: {
      domain: 'PMNT',
      family: direction === 'CRDT' ? 'RCDT' : 'ICDT',
      subFamily: 'DMCT',
    },
    kind: direction === 'CRDT' ? 'incoming_transfer' : 'outgoing_transfer',
    counterparty: { name: 'Counterparty AG', country: 'CH', iban: null },
    remittance: 'Payment',
    sourceFile: 'test.xml',
    ...overrides,
  };
}

export function buildCashDeposit(amount: number, bookingDate: string): Transaction {
  return buildTx({
    amount,
    bookingDate,
    direction: 'CRDT',
    kind: 'cash_deposit',
    bankTxCode: { domain: 'PMNT', family: 'CNTR', subFamily: 'CDPT' },
    counterparty: { name: 'Owner (Bareinzahlung)', country: 'CH', iban: null },
    remittance: 'Bareinzahlung',
  });
}

export function buildClient(overrides: Partial<ClientProfile> = {}): ClientProfile {
  return {
    clientId: 'C9999',
    name: 'Test Client',
    clientType: 'Privatperson',
    occupation: 'Angestellte',
    age: 40,
    riskCategory: 'normal',
    riskCategoryLabel: 'normal',
    expectedMonthlyInflow: 500_000,
    expectedMonthlyOutflow: 450_000,
    expectedCountries: ['CH'],
    iban: TEST_IBAN,
    ...overrides,
  };
}
