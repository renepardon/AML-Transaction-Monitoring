import { actorLabel } from '../actors';
import { escapeCsvCell } from '../csv/parseCsv';
import { formatMonth } from '../dates';
import { formatIban } from '../iban';
import { formatChf, formatChfRounded as chf } from '../money';
import { COUNTRY_LISTS_AS_OF, COUNTRY_TIER_LABEL, countryRiskTier } from '../reference/countryRisk';
import { CASH_IDENTIFICATION_THRESHOLD_CHF, SMURFING_NOTE } from '../reference/thresholds';
import { RULE_META, type RuleId } from '../rules/types';
import { splitSentences } from '../triage/sentences';
import type { ReportInput, ReportSection } from './ReportDrafter';

/** Structure close to an MROS suspicious activity report (Art. 9 GwG), submitted via goAML. */
export const MROS_SECTIONS = [
  { id: 'institution', title: '1. Reporting institution' },
  { id: 'subject', title: '2. Subject' },
  { id: 'summary', title: '3. Summary of the suspicion' },
  { id: 'transactions', title: '4. Transactions concerned' },
  { id: 'profile', title: '5. Comparison with the client profile' },
  { id: 'red_flags', title: '6. Red flags matched' },
  { id: 'clarifications', title: '7. Clarifications done and analyst reasoning' },
  { id: 'measures', title: '8. Measures taken / recommended' },
  { id: 'attachments', title: '9. Attachments' },
] as const;

const day = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');
/** Markdown table cell: no pipes or newlines, formula-injection safe. */
const cell = (v: string) => escapeCsvCell(v.replace(/[|\r\n]+/g, ' ')).replace(/^"|"$/g, '');

function thresholdNote(rule: RuleId, input: ReportInput): string {
  const c = input.config;
  switch (rule) {
    case 'R1_STRUCTURING':
      return `Cash deposits of ${chf(c.structuring.thresholdChf * c.structuring.bandRatio * 100)}–${formatChf(c.structuring.thresholdChf * 100 - 1)} (identification threshold ${chf(CASH_IDENTIFICATION_THRESHOLD_CHF * 100)}, GwV-FINMA Art. 51 para. 1 lit. b, VSB 20), ≥ ${c.structuring.minCount} in ${c.structuring.windowDays} days. ${SMURFING_NOTE}`;
    case 'R2_PASS_THROUGH':
      return `Credit ≥ max(${chf(c.passThrough.minCreditChf * 100)}, ${c.passThrough.inflowMultiple}× expected monthly inflow), ≥ ${c.passThrough.minOutRatio * 100} % paid out within ${c.passThrough.windowDays} days.`;
    case 'R3_PROFILE_DEVIATION':
      return `Monthly inflow or outflow > ${c.profileDeviation.multiple}× the expected value and ≥ ${chf(c.profileDeviation.minExcessChf * 100)} above it.`;
    case 'R4_RISK_COUNTRY':
      return `FATF lists as of ${COUNTRY_LISTS_AS_OF}; the bank's internal risk list is a demo policy and not a FATF list. Countries outside the expected set flagged from ${chf(c.riskCountry.unexpectedMinChf * 100)}.`;
    case 'R5_PURPOSE_MISMATCH':
      return `Amount ≥ ${chf(c.purposeMismatch.minChf * 100)} with keywords (${c.purposeMismatch.keywords.join(', ')}) or an own-account transfer abroad.`;
  }
}

export function buildMrosSections(input: ReportInput): ReportSection[] {
  const { client, caseRecord: cr, alerts } = input;
  const top = [...alerts].sort((a, b) => (b.triage?.score ?? 0) - (a.triage?.score ?? 0))[0];
  const evidenceIds = new Set(alerts.flatMap((a) => a.hit.evidenceTxIds));
  const evidence = input.transactions
    .filter((t) => evidenceIds.has(t.id))
    .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
  const rules = [...new Set(alerts.map((a) => a.hit.ruleId))].sort();
  const decision = cr.decision;

  const summary = [
    ...splitSentences(top?.triage?.explanation ?? 'No AI explanation available.').slice(0, 3),
    decision
      ? `The case was escalated by ${decision.actor.name} on ${day(decision.at)}: “${decision.reason}”`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const txTable = [
    '| Date | Amount | Direction | Counterparty | Country | Purpose | Evidence ref |',
    '|---|---:|---|---|---|---|---|',
    ...evidence.map(
      (t) =>
        `| ${day(t.bookingDate)} | ${formatChf(t.amount)} | ${t.direction === 'CRDT' ? 'In' : 'Out'} | ${cell(t.counterparty.name)} | ${t.counterparty.country ?? '–'} | ${cell(t.remittance)} | ${t.acctSvcrRef} |`,
    ),
  ].join('\n');

  const profileTable = [
    '| Month | Inflow | × expected | Outflow | × expected |',
    '|---|---:|---:|---:|---:|',
    ...input.monthly.map(
      (m) =>
        `| ${formatMonth(m.month)} | ${chf(m.inflow)} | ${(m.inflow / Math.max(1, client.expectedMonthlyInflow)).toFixed(1)}× | ${chf(m.outflow)} | ${(m.outflow / Math.max(1, client.expectedMonthlyOutflow)).toFixed(1)}× |`,
    ),
    '',
    `Expected per month: inflow ${chf(client.expectedMonthlyInflow)}, outflow ${chf(client.expectedMonthlyOutflow)}, countries ${client.expectedCountries.join(', ')}.`,
  ].join('\n');

  const flags = rules.map((r) => {
    const hits = alerts.filter((a) => a.hit.ruleId === r).map((a) => `  – ${a.hit.summary}`);
    return `• ${RULE_META[r].short} ${RULE_META[r].name}: ${RULE_META[r].description}\n${hits.join('\n')}\n  Threshold: ${thresholdNote(r, input)}`;
  });

  const countries = [
    ...new Set(
      evidence.map((t) => t.counterparty.country).filter((c): c is string => !!c && c !== 'CH'),
    ),
  ];
  const notes = cr.notes.map((n) => `• ${day(n.at)} ${n.actor.name}: ${n.text}`);
  const measures = [
    '• Report to MROS under Art. 9 GwG if the suspicion is founded; otherwise consider the right to report under Art. 305ter para. 2 StGB.',
    '• Do not inform the client or third parties about a report (Art. 10a GwG).',
    rules.includes('R1_STRUCTURING') &&
      '• Request documentation on the origin of the cash (sales contracts, cash book).',
    rules.includes('R2_PASS_THROUGH') &&
      '• Request contracts and invoices for the incoming and outgoing payments; clarify the economic background (Art. 6 para. 2 GwG).',
    rules.includes('R5_PURPOSE_MISMATCH') &&
      '• Clarify the purpose of the flagged payments and, for own-account transfers abroad, obtain the beneficiary account statement.',
    countries.length > 0 &&
      `• Review the relationships with counterparties in ${countries.map((c) => `${c} (${COUNTRY_TIER_LABEL[countryRiskTier(c)]})`).join(', ')}.`,
    '• Keep enhanced monitoring of the business relationship until the case is resolved.',
  ].filter(Boolean);

  const statements = [...new Set(input.statements.map((s) => s.id))].sort();
  const audit = input.auditRange
    ? `Audit log entries #${input.auditRange.fromSeq}–#${input.auditRange.toSeq} (hash ${input.auditRange.fromHash.slice(0, 12)}… → ${input.auditRange.toHash.slice(0, 12)}…)`
    : 'Audit log: no entries found';

  const bodies: Record<(typeof MROS_SECTIONS)[number]['id'], string> = {
    institution: `Bank Zürichsee (BIC ZSEECH22XXX)\nReporting officer: ${actorLabel(input.reportingOfficer)}\nDate: ${day(input.generatedAt)}\nChannel: MROS via goAML – draft, not submitted`,
    subject: `${client.name} (${client.clientId}) – ${client.clientType}\nOccupation / business: ${client.occupation}${client.age ? `\nAge: ${client.age}` : ''}\nRisk category: ${client.riskCategoryLabel}\nAccount: ${formatIban(client.iban)}`,
    summary,
    transactions: txTable,
    profile: profileTable,
    red_flags: flags.join('\n\n'),
    clarifications: [
      notes.length > 0 ? `Analyst notes:\n${notes.join('\n')}` : 'No analyst notes recorded.',
      cr.conversation.length > 0
        ? `${cr.conversation.length / 2} follow-up question(s) answered by the simulated AI assistant.`
        : '',
      decision
        ? `Decision: escalated by ${actorLabel(decision.actor)} on ${day(decision.at)}. Reason: ${decision.reason}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    measures: measures.join('\n'),
    attachments: [
      `Statements: ${statements.join(', ')}`,
      `Alerts: ${alerts.map((a) => a.id).join(', ')}`,
      audit,
      `Case notes: ${cr.notes.length}`,
    ].join('\n'),
  };
  return MROS_SECTIONS.map((s) => ({ ...s, body: bodies[s.id] }));
}

export function reportToMarkdown(title: string, sections: ReportSection[], banner: string): string {
  return [
    `# ${title}`,
    '',
    `> **${banner}**`,
    '',
    ...sections.flatMap((s) => [`## ${s.title}`, '', s.body, '']),
  ].join('\n');
}
