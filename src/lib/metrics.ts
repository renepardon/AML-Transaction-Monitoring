import {
  countryRiskTier,
  COUNTRY_TIER_LABEL,
  type CountryRiskTier,
} from '@/domain/reference/countryRisk';
import { formatChfRounded, formatMonth, formatPercent } from './format';

const MONEY = new Set([
  'sum',
  'min',
  'max',
  'threshold',
  'credit',
  'debits',
  'inflow',
  'outflow',
  'expectedInflow',
  'expectedOutflow',
  'amount',
]);
const RATIO_X = new Set(['inflowRatio', 'outflowRatio', 'maxRatio']);

const LABELS: Record<string, string> = {
  count: 'Deposits',
  sum: 'Total',
  min: 'Smallest',
  max: 'Largest',
  threshold: 'Threshold',
  spanDays: 'Span (days)',
  credit: 'Credit',
  debits: 'Paid out',
  ratio: 'Paid-out share',
  daysBetween: 'Days in → out',
  inCounterparty: 'From',
  inCountry: 'From country',
  outCounterparties: 'To',
  outCountries: 'To countries',
  month: 'Month',
  direction: 'Direction',
  inflow: 'Inflow',
  outflow: 'Outflow',
  expectedInflow: 'Expected inflow',
  expectedOutflow: 'Expected outflow',
  inflowRatio: 'Inflow vs expected',
  outflowRatio: 'Outflow vs expected',
  maxRatio: 'Max deviation',
  country: 'Country',
  tier: 'Country list',
  unexpected: 'Outside expected countries',
  amount: 'Amount',
  counterparty: 'Counterparty',
  keywords: 'Keywords',
  ownAccountAbroad: 'Own account abroad',
  purpose: 'Purpose',
};

export function metricLabel(key: string): string {
  return LABELS[key] ?? key;
}

export function formatMetric(key: string, value: number | string): string {
  if (MONEY.has(key) && typeof value === 'number') return formatChfRounded(value);
  if (RATIO_X.has(key)) return `${Number(value).toFixed(1)}×`;
  if (key === 'ratio') return formatPercent(Number(value));
  if (key === 'month') return formatMonth(String(value));
  if (key === 'tier') return COUNTRY_TIER_LABEL[value as CountryRiskTier] ?? String(value);
  if (key === 'country') return `${value} · ${COUNTRY_TIER_LABEL[countryRiskTier(String(value))]}`;
  if (key === 'direction')
    return value === 'CRDT' ? 'Incoming' : value === 'DBIT' ? 'Outgoing' : String(value);
  return String(value === '' ? '–' : value);
}
