import type { ReconciliationReport } from '../camt053/reconcile';

export interface DataWarning {
  ruleId: 'R0_DATA_INTEGRITY';
  type: 'reconciliation' | 'continuity' | 'duplicate';
  ref: string;
  message: string;
}

/** R0: data warnings (not AML alerts) for balance mismatches and duplicate AcctSvcrRef. */
export function dataIntegrity(input: {
  reconciliation: ReconciliationReport;
  duplicates: string[];
}): DataWarning[] {
  const warnings: DataWarning[] = [];
  for (const s of input.reconciliation.statements.filter((x) => !x.ok)) {
    warnings.push({
      ruleId: 'R0_DATA_INTEGRITY',
      type: 'reconciliation',
      ref: s.statementId,
      message: `Statement ${s.statementId}: OPBD + Σ entries ≠ CLBD (difference ${s.difference / 100} CHF)`,
    });
  }
  for (const c of input.reconciliation.continuity.filter((x) => !x.ok)) {
    warnings.push({
      ruleId: 'R0_DATA_INTEGRITY',
      type: 'continuity',
      ref: c.toStatementId,
      message: `Closing balance of ${c.fromStatementId} does not equal opening balance of ${c.toStatementId}`,
    });
  }
  for (const id of input.duplicates) {
    warnings.push({
      ruleId: 'R0_DATA_INTEGRITY',
      type: 'duplicate',
      ref: id,
      message: `Duplicate AcctSvcrRef ${id.split(':')[1] ?? id}`,
    });
  }
  return warnings;
}
