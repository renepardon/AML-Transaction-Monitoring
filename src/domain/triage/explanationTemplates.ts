import { formatDay, formatMonthLong } from '../dates';
import { formatChfRounded as chf } from '../money';
import { countryInSentence, countryName } from '../reference/iso';
import { countryRiskTier, COUNTRY_TIER_LABEL } from '../reference/countryRisk';
import { RULE_META, type RuleHit, type RuleId } from '../rules/types';
import type { ClientProfile, Transaction } from '../types';
import { keyTransactions, type MitigatingFact } from './mitigation';

export interface TemplateInput {
  hit: RuleHit;
  client: ClientProfile;
  clientHits: RuleHit[];
  txById: Map<string, Transaction>;
  mitigations: MitigatingFact[];
  mitigated: boolean;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (xs: string[]) =>
  xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
const footprint = (c: ClientProfile) => `expected ${c.expectedCountries.join('/')} footprint`;
const place = (cc: string | null) => (cc ? countryName(cc) : 'unknown country');
const later = (days: number) =>
  days === 0 ? 'the same day' : days === 1 ? 'one day later' : `${days} days later`;
const evidence = (t: TemplateInput) =>
  t.hit.evidenceTxIds.map((id) => t.txById.get(id)).filter((x): x is Transaction => !!x);

function otherRulesSentence(t: TemplateInput): string {
  const others = [...new Set(t.clientHits.map((h) => h.ruleId))].filter((r) => r !== t.hit.ruleId);
  if (others.length === 0) return '';
  const names = others.map((r: RuleId) => RULE_META[r].name.toLowerCase());
  return `Together with ${list(names)} alerts on the same client, the source and use of these funds need to be documented.`;
}

function passThrough(t: TemplateInput): string[] {
  const [credit, ...debits] = evidence(t);
  if (!credit) return [t.hit.summary];
  const days = Number(t.hit.metrics.daysBetween);
  const outNames = [...new Set(debits.map((d) => d.counterparty.name))];
  const outPlaces = [...new Set(debits.map((d) => place(d.counterparty.country)))];
  const s1 = `${t.client.name} received ${chf(credit.amount)} from ${credit.counterparty.name} (${place(credit.counterparty.country)}) as "${credit.remittance}" and paid out ${(Number(t.hit.metrics.ratio) * 100).toFixed(1)} % of it to ${list(outNames)} (${list(outPlaces)}) ${later(days)}.`;
  const unexpected = [
    ...new Set(
      [credit, ...debits]
        .map((x) => x.counterparty.country)
        .filter((c): c is string => !!c && !t.client.expectedCountries.includes(c)),
    ),
  ];
  const s2 = `A credit labelled "${credit.remittance}" does not fit the profile "${t.client.occupation}"${unexpected.length > 0 ? `, and ${list(unexpected.map((c) => countryInSentence(c)))} ${unexpected.length > 1 ? 'are' : 'is'} outside the ${footprint(t.client)}` : ''}.`;
  const other = t.clientHits.find(
    (h) => h.ruleId === 'R2_PASS_THROUGH' && h.evidenceTxIds[0] !== credit.id,
  );
  const crypto = debits.some((d) =>
    /crypto|exchange/i.test(`${d.counterparty.name} ${d.remittance}`),
  );
  let s3 =
    'Funds moving through the account this quickly, without a business reason, are a typical layering signal.';
  if (other)
    s3 = `The same pattern also occurred in ${formatMonthLong(other.period.from)} with ${chf(Number(other.metrics.credit))}, which points to a pass-through account.`;
  else if (crypto && (t.client.age ?? 0) >= 65)
    s3 = `For a ${t.client.age}-year-old client this fits a money mule or an investment scam victim, so the client should be contacted before any further payment.`;
  return [s1, s2, s3];
}

function structuring(t: TemplateInput): string[] {
  const m = t.hit.metrics;
  const s1 = `${t.client.name} made ${m.count} cash deposits between ${formatDay(t.hit.period.from)} and ${formatDay(t.hit.period.to)}, each between ${chf(Number(m.min))} and ${chf(Number(m.max))} and so just below the ${chf(Number(m.threshold))} identification threshold (Σ ${chf(Number(m.sum))}).`;
  const s2 = `Amounts clustered this tightly under the threshold are the textbook structuring pattern and do not look like the ordinary takings of "${t.client.occupation}".`;
  const r3 = t.clientHits.find(
    (h) =>
      h.ruleId === 'R3_PROFILE_DEVIATION' &&
      String(h.metrics.month) === t.hit.period.from.slice(0, 7),
  );
  const elevated =
    t.client.riskCategory === 'elevated'
      ? `the client is already in risk category "${t.client.riskCategoryLabel}"`
      : '';
  const s3 = r3
    ? `Inflow that month reached ${Number(r3.metrics.inflowRatio).toFixed(1)}× the expected volume${elevated ? `, and ${elevated}` : ''}.`
    : elevated
      ? `${cap(elevated)}.`
      : '';
  return [s1, s2, s3];
}

function profileDeviation(t: TemplateInput): string[] {
  const m = t.hit.metrics;
  const [driver] = keyTransactions(t.hit, t.txById);
  const parts: string[] = [];
  if (m.direction !== 'outflow')
    parts.push(
      `an inflow of ${chf(Number(m.inflow))} (${Number(m.inflowRatio).toFixed(1)}× the expected ${chf(Number(m.expectedInflow))})`,
    );
  if (m.direction !== 'inflow')
    parts.push(
      `an outflow of ${chf(Number(m.outflow))} (${Number(m.outflowRatio).toFixed(1)}× the expected ${chf(Number(m.expectedOutflow))})`,
    );
  const cash = evidence(t).filter((x) => x.kind === 'cash_deposit');
  const drive = !driver
    ? ''
    : driver.kind === 'cash_deposit'
      ? `, driven mainly by ${cash.length} cash deposits totalling ${chf(cash.reduce((sum, x) => sum + x.amount, 0))}`
      : `, driven mainly by ${chf(driver.amount)} ${driver.direction === 'CRDT' ? 'from' : 'to'} ${driver.counterparty.name} (${driver.counterparty.country ?? '–'}) for "${driver.remittance}"`;
  const s1 = `In ${formatMonthLong(String(m.month))}, ${t.client.name} had ${list(parts)}${drive}.`;
  if (!t.mitigated) {
    return [
      s1,
      `No income source in the profile ("${t.client.occupation}") explains a deviation of this size.`,
      otherRulesSentence(t),
    ];
  }
  const order = ['domestic_contract', 'one_off_below_income', 'salary_payer', 'salary_remittance'];
  const ordered = [...t.mitigations].sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
  const reasons = ordered
    .map((f) => {
      if (f.code === 'domestic_contract')
        return 'the payment references a purchase contract with a domestic counterparty';
      if (f.code === 'salary_payer') return 'the counterparty is the known salary payer';
      if (f.code === 'one_off_below_income')
        return 'it is a one-off amount below six monthly incomes';
      if (f.code === 'salary_remittance')
        return (
          'a ' +
          f.text
            .replace(/\.$/, '')
            .replace(/ on (\d{4}-\d{2}-\d{2})$/, (_, d: string) => ` arrived on ${formatDay(d)}`)
        );
      return '';
    })
    .filter(Boolean);
  return [
    s1,
    `${cap(list(reasons))}.`,
    'This looks like a one-off private expense explained by the profile, so closing it as a false positive is suggested.',
  ];
}

function riskCountry(t: TemplateInput): string[] {
  const [tx] = evidence(t);
  if (!tx) return [t.hit.summary];
  const cc = tx.counterparty.country ?? '';
  const tier = countryRiskTier(cc);
  const s1 = `${t.client.name} ${tx.direction === 'CRDT' ? 'received' : 'sent'} ${chf(tx.amount)} ${tx.direction === 'CRDT' ? 'from' : 'to'} ${tx.counterparty.name} in ${countryInSentence(cc)} on ${formatDay(tx.bookingDate)}.`;
  const tierPart =
    tier === 'internal_elevated'
      ? "on the bank's internal risk list (demo policy, not FATF)"
      : tier === 'standard'
        ? ''
        : `on the FATF list "${COUNTRY_TIER_LABEL[tier]}"`;
  const outside = t.hit.metrics.unexpected === 'yes' ? `outside the ${footprint(t.client)}` : '';
  const where = [tierPart, outside].filter(Boolean).join(' and ');
  const s2 = `${countryInSentence(cc, true)} is ${where}, and the purpose "${tx.remittance}" gives no business reason for the transfer.`;
  return [s1, s2, otherRulesSentence(t)];
}

function purposeMismatch(t: TemplateInput): string[] {
  const [tx] = evidence(t);
  if (!tx) return [t.hit.summary];
  const s1 = `${t.client.name} ${tx.direction === 'CRDT' ? 'received' : 'sent'} ${chf(tx.amount)} ${tx.direction === 'CRDT' ? 'from' : 'to'} ${tx.counterparty.name} (${place(tx.counterparty.country)}) with the purpose "${tx.remittance}".`;
  const keywords = String(t.hit.metrics.keywords || '')
    .split(', ')
    .filter(Boolean);
  const s2 =
    t.hit.metrics.ownAccountAbroad === 'yes'
      ? `The beneficiary carries the client's own name in ${place(tx.counterparty.country)}, which moves the funds out of the bank's view without a stated business reason.`
      : `Payments involving ${list(keywords.map((k) => `"${k}"`))} do not fit the profile "${t.client.occupation}".`;
  return [s1, s2, otherRulesSentence(t)];
}

const TEMPLATES: Record<RuleId, (t: TemplateInput) => string[]> = {
  R1_STRUCTURING: structuring,
  R2_PASS_THROUGH: passThrough,
  R3_PROFILE_DEVIATION: profileDeviation,
  R4_RISK_COUNTRY: riskCountry,
  R5_PURPOSE_MISMATCH: purposeMismatch,
};

/** Builds the analyst-style explanation from real numbers, dates, counterparties and profile facts. */
export function composeExplanation(t: TemplateInput): string {
  return TEMPLATES[t.hit.ruleId](t).filter(Boolean).join(' ');
}
