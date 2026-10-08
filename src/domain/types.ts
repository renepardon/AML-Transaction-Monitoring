/** Money is always an integer amount of Rappen (1 CHF = 100 Rappen). */
export type Rappen = number;

export type Direction = 'CRDT' | 'DBIT';

export type TxKind = 'incoming_transfer' | 'outgoing_transfer' | 'cash_deposit' | 'other';

export interface BankTxCode {
  domain: string;
  family: string;
  subFamily: string;
}

export interface Counterparty {
  name: string;
  country: string | null;
  iban: string | null;
}

export interface Transaction {
  /** Stable id: `${iban}:${acctSvcrRef}` */
  id: string;
  statementId: string;
  iban: string;
  clientId: string | null;
  bookingDate: string;
  valueDate: string;
  /** Always positive. */
  amount: Rappen;
  /** Positive for credits, negative for debits. */
  signed: Rappen;
  currency: string;
  direction: Direction;
  status: string;
  acctSvcrRef: string;
  bankTxCode: BankTxCode;
  kind: TxKind;
  counterparty: Counterparty;
  remittance: string;
  sourceFile: string;
}

export interface Statement {
  id: string;
  msgId: string;
  iban: string;
  currency: string;
  ownerName: string;
  bic: string;
  from: string;
  to: string;
  openingBalance: Rappen;
  closingBalance: Rappen;
  openingDate: string;
  closingDate: string;
  entryCount: number;
  sourceFile: string;
}

export type RiskCategory = 'normal' | 'elevated';

export interface ClientProfile {
  clientId: string;
  name: string;
  clientType: string;
  occupation: string;
  age: number | null;
  riskCategory: RiskCategory;
  /** Original label from the source file, e.g. "erhöht". */
  riskCategoryLabel: string;
  expectedMonthlyInflow: Rappen;
  expectedMonthlyOutflow: Rappen;
  expectedCountries: string[];
  iban: string;
}

export interface MonthlyAggregate {
  clientId: string;
  month: string;
  inflow: Rappen;
  outflow: Rappen;
  txCount: number;
}
