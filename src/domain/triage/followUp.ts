import { formatDay } from '../dates';
import { formatChfRounded as chf } from '../money';
import { countryName } from '../reference/iso';
import { countryRiskTier, COUNTRY_TIER_LABEL } from '../reference/countryRisk';
import { RULE_META, type RuleHit } from '../rules/types';
import type { ClientProfile, MonthlyAggregate, Transaction } from '../types';
import { formatMonth } from '../dates';
import { detectMitigations } from './mitigation';
import { scoreAlert } from './scoring';

export interface FollowUpContext {
  client: ClientProfile;
  hits: RuleHit[];
  transactions: Transaction[];
  monthly: MonthlyAggregate[];
  caseScore: number;
  otherCases: { clientName: string; rules: string[] }[];
}

export type FollowUpIntent =
  'countries' | 'timeline' | 'profile' | 'why_score' | 'similar' | 'help';

export const SUGGESTED_QUESTIONS: { intent: FollowUpIntent; label: string }[] = [
  { intent: 'countries', label: 'Which countries are involved?' },
  { intent: 'timeline', label: 'Show the timeline' },
  { intent: 'profile', label: 'How does this compare to the profile?' },
  { intent: 'why_score', label: 'Why this score?' },
  { intent: 'similar', label: 'Any similar cases?' },
];

export function detectIntent(question: string): FollowUpIntent {
  const q = question.toLowerCase();
  if (/why|score|risk/.test(q)) return 'why_score';
  if (/countr|land|jurisdiction|where|fatf/.test(q)) return 'countries';
  if (/timeline|when|chronolog|sequence|order|history/.test(q)) return 'timeline';
  if (/profile|expected|occupation|kyc|normal|usual/.test(q)) return 'profile';
  if (/similar|pattern|other|compar|like this/.test(q)) return 'similar';
  return 'help';
}

const evidenceTx = (ctx: FollowUpContext) => {
  const ids = new Set(ctx.hits.flatMap((h) => h.evidenceTxIds));
  return ctx.transactions
    .filter((t) => ids.has(t.id))
    .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
};

function countries(ctx: FollowUpContext): string {
  const byCountry = new Map<string, number>();
  for (const t of evidenceTx(ctx)) {
    const cc = t.counterparty.country ?? '??';
    byCountry.set(cc, (byCountry.get(cc) ?? 0) + t.amount);
  }
  const lines = [...byCountry.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cc, sum]) => {
      const tier = countryRiskTier(cc);
      const expected = ctx.client.expectedCountries.includes(cc) ? 'expected' : 'not expected';
      return `• ${countryName(cc)} (${cc}): ${chf(sum)} – ${COUNTRY_TIER_LABEL[tier]}, ${expected}`;
    });
  return `Countries in the flagged transactions (expected: ${ctx.client.expectedCountries.join(', ')}):\n${lines.join('\n')}\nNone of these is on a FATF list unless stated; the internal list is a demo bank policy.`;
}

function timeline(ctx: FollowUpContext): string {
  const lines = evidenceTx(ctx)
    .slice(0, 14)
    .map(
      (t) =>
        `• ${formatDay(t.bookingDate)} ${t.direction === 'CRDT' ? '+' : '−'}${chf(t.amount)} ${t.direction === 'CRDT' ? 'from' : 'to'} ${t.counterparty.name} (${t.counterparty.country ?? '–'}) "${t.remittance}"`,
    );
  return `Timeline of the flagged transactions:\n${lines.join('\n')}`;
}

function profile(ctx: FollowUpContext): string {
  const c = ctx.client;
  const months = ctx.monthly.map(
    (m) =>
      `• ${formatMonth(m.month)}: in ${chf(m.inflow)} (${(m.inflow / Math.max(1, c.expectedMonthlyInflow)).toFixed(1)}×), out ${chf(m.outflow)} (${(m.outflow / Math.max(1, c.expectedMonthlyOutflow)).toFixed(1)}×)`,
  );
  return `${c.name}: ${c.clientType}, ${c.occupation}${c.age ? `, age ${c.age}` : ''}, risk category "${c.riskCategoryLabel}". Expected per month: in ${chf(c.expectedMonthlyInflow)}, out ${chf(c.expectedMonthlyOutflow)}, countries ${c.expectedCountries.join(', ')}.\nActual:\n${months.join('\n')}`;
}

function whyScore(ctx: FollowUpContext): string {
  const top = [...ctx.hits].sort(
    (a, b) => (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0),
  )[0];
  if (!top) return 'There are no alerts on this case.';
  const breakdown = scoreAlert(
    top,
    ctx.client,
    ctx.hits,
    detectMitigations(top, ctx.client, ctx.transactions),
  );
  const factors = breakdown.factors.map((f) => `• ${f.delta > 0 ? '+' : ''}${f.delta}: ${f.label}`);
  return `The case score is ${ctx.caseScore}/5, the maximum over its alerts. For the ${RULE_META[top.ruleId].name} alert: base ${breakdown.base} from severity "${top.severity}"\n${factors.join('\n') || '• no further factors'}\n= ${breakdown.score}/5 (clamped to 1–5). The score supports the analyst; it does not decide the case.`;
}

function similar(ctx: FollowUpContext): string {
  const mine = new Set(ctx.hits.map((h) => RULE_META[h.ruleId].name));
  const overlaps = ctx.otherCases
    .map((o) => ({ ...o, shared: o.rules.filter((r) => mine.has(r)) }))
    .filter((o) => o.shared.length > 0)
    .map((o) => `• ${o.clientName}: shares ${o.shared.join(', ')}`);
  return overlaps.length > 0
    ? `Other cases in this dataset with overlapping red flags:\n${overlaps.join('\n')}\nOverlap in rules does not mean the clients are connected; no shared counterparties were checked.`
    : 'No other case in this dataset shares these red flags.';
}

/** Canned, fact-based answers for the analyst's follow-up questions (stage 5). */
export function answerFollowUp(ctx: FollowUpContext, question: string): string {
  switch (detectIntent(question)) {
    case 'countries':
      return countries(ctx);
    case 'timeline':
      return timeline(ctx);
    case 'profile':
      return profile(ctx);
    case 'why_score':
      return whyScore(ctx);
    case 'similar':
      return similar(ctx);
    default:
      return 'I can answer questions about the countries involved, the timeline, the client profile, why the case has its score, and similar cases. Please rephrase using one of these topics.';
  }
}
