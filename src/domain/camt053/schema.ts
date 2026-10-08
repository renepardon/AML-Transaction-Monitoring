import { z } from 'zod';
import { isIsoDate } from '../dates';
import { isValidIban, normalizeIban } from '../iban';
import { AMOUNT_REGEX } from '../money';
import { isIsoCountry, isIsoCurrency } from '../reference/iso';

export const CAMT053_NAMESPACE_REGEX =
  /^urn:iso:std:iso:20022:tech:xsd:camt\.053\.001\.(0[2-9]|1[0-9])$/;

const amount = z.string().regex(AMOUNT_REGEX, 'Amount must match ^\\d{1,13}(\\.\\d{1,2})?$');
const currency = z.string().refine(isIsoCurrency, 'Currency must be ISO 4217');
const isoDate = z.string().refine((v) => isIsoDate(v.slice(0, 10)), 'Date must be ISO 8601');
const cdtDbt = z.enum(['CRDT', 'DBIT']);
const iban = z.string().transform(normalizeIban).refine(isValidIban, 'IBAN fails mod-97');
const country = z.string().refine(isIsoCountry, 'Country must be ISO 3166-1 alpha-2').nullable();

export const rawEntrySchema = z.object({
  amount,
  currency,
  cdtDbtInd: cdtDbt,
  status: z.string().min(1),
  bookingDate: isoDate,
  valueDate: isoDate,
  acctSvcrRef: z.string().min(1, 'AcctSvcrRef is required'),
  domain: z.string(),
  family: z.string(),
  subFamily: z.string(),
  counterpartyName: z.string(),
  counterpartyCountry: country,
  counterpartyIban: iban.nullable(),
  remittance: z.string(),
});

export const rawBalanceSchema = z.object({
  code: z.enum(['OPBD', 'CLBD']),
  amount,
  currency,
  cdtDbtInd: cdtDbt,
  date: isoDate,
});

export const rawStatementSchema = z.object({
  id: z.string().min(1),
  from: z.string(),
  to: z.string(),
  iban,
  currency,
  ownerName: z.string(),
  bic: z.string(),
  balances: z.array(rawBalanceSchema).length(2),
  entries: z.array(rawEntrySchema),
});

export type RawEntry = z.input<typeof rawEntrySchema>;
export type RawStatement = z.input<typeof rawStatementSchema>;
