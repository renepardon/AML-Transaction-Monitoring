import type { BankTxCode, Direction, TxKind } from '../types';

/**
 * ISO 20022 bank transaction codes found in the files:
 * PMNT/RCDT/DMCT = incoming credit transfer, PMNT/ICDT/DMCT = outgoing credit transfer,
 * PMNT/CNTR/CDPT = cash deposit.
 */
export function classifyBankTxCode(code: BankTxCode, direction: Direction): TxKind {
  if (code.domain !== 'PMNT') return 'other';
  if (code.family === 'CNTR' && code.subFamily === 'CDPT' && direction === 'CRDT') {
    return 'cash_deposit';
  }
  if (code.family === 'RCDT') return 'incoming_transfer';
  if (code.family === 'ICDT') return 'outgoing_transfer';
  return 'other';
}

export const TX_KIND_LABEL: Record<TxKind, string> = {
  incoming_transfer: 'Incoming transfer',
  outgoing_transfer: 'Outgoing transfer',
  cash_deposit: 'Cash deposit',
  other: 'Other',
};
