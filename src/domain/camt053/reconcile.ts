import type { Rappen, Statement, Transaction } from '../types';

export interface StatementReconciliation {
  statementId: string;
  iban: string;
  opening: Rappen;
  closing: Rappen;
  sumEntries: Rappen;
  expectedClosing: Rappen;
  difference: Rappen;
  ok: boolean;
}

export interface ContinuityCheck {
  iban: string;
  fromStatementId: string;
  toStatementId: string;
  previousClosing: Rappen;
  nextOpening: Rappen;
  ok: boolean;
}

export interface ReconciliationReport {
  statements: StatementReconciliation[];
  continuity: ContinuityCheck[];
  allOk: boolean;
}

/** Checks OPBD + Σ(signed entries) = CLBD per statement, and CLBD(month n) = OPBD(month n+1) per account. */
export function reconcile(
  statements: Statement[],
  transactions: Transaction[],
): ReconciliationReport {
  const sums = new Map<string, Rappen>();
  for (const tx of transactions)
    sums.set(tx.statementId, (sums.get(tx.statementId) ?? 0) + tx.signed);

  const results = statements.map((s) => {
    const sumEntries = sums.get(s.id) ?? 0;
    const expectedClosing = s.openingBalance + sumEntries;
    return {
      statementId: s.id,
      iban: s.iban,
      opening: s.openingBalance,
      closing: s.closingBalance,
      sumEntries,
      expectedClosing,
      difference: s.closingBalance - expectedClosing,
      ok: expectedClosing === s.closingBalance,
    };
  });

  const byIban = new Map<string, Statement[]>();
  for (const s of statements) byIban.set(s.iban, [...(byIban.get(s.iban) ?? []), s]);
  const continuity: ContinuityCheck[] = [];
  for (const [iban, list] of byIban) {
    const sorted = [...list].sort((a, b) => a.from.localeCompare(b.from));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const next = sorted[i]!;
      continuity.push({
        iban,
        fromStatementId: prev.id,
        toStatementId: next.id,
        previousClosing: prev.closingBalance,
        nextOpening: next.openingBalance,
        ok: prev.closingBalance === next.openingBalance,
      });
    }
  }
  return {
    statements: results,
    continuity,
    allOk: results.every((r) => r.ok) && continuity.every((c) => c.ok),
  };
}

export interface DedupeResult {
  transactions: Transaction[];
  duplicates: Transaction[];
}

/** De-duplicates by IBAN + AcctSvcrRef (the transaction id). The first occurrence wins. */
export function dedupeTransactions(transactions: Transaction[]): DedupeResult {
  const seen = new Set<string>();
  const unique: Transaction[] = [];
  const duplicates: Transaction[] = [];
  for (const tx of transactions) {
    if (seen.has(tx.id)) duplicates.push(tx);
    else {
      seen.add(tx.id);
      unique.push(tx);
    }
  }
  return { transactions: unique, duplicates };
}
