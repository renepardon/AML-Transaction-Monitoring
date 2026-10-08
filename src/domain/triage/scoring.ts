import { countryName } from '../reference/iso';
import { countryRiskTier, COUNTRY_TIER_LABEL } from '../reference/countryRisk';
import { RULE_META, type RuleHit, type Severity } from '../rules/types';
import type { ClientProfile } from '../types';
import type { Score } from './TriageProvider';
import { mitigationDeduction, type MitigatingFact } from './mitigation';

const SEVERITY_BASE: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

export interface ScoreBreakdown {
  score: Score;
  base: number;
  factors: { label: string; delta: number }[];
}

export function maxDeviation(clientHits: RuleHit[]): number {
  return Math.max(
    0,
    ...clientHits
      .filter((h) => h.ruleId === 'R3_PROFILE_DEVIATION')
      .map((h) => Number(h.metrics.maxRatio) || 0),
  );
}

/** Countries on a non-standard tier that received money in a pass-through. */
export function passThroughRiskCountries(clientHits: RuleHit[]): string[] {
  const out = clientHits
    .filter((h) => h.ruleId === 'R2_PASS_THROUGH')
    .flatMap((h) =>
      String(h.metrics.outCountries ?? '')
        .split(',')
        .map((c) => c.trim()),
    )
    .filter((c) => c && countryRiskTier(c) !== 'standard');
  return [...new Set(out)];
}

const clamp = (n: number): Score => Math.min(5, Math.max(1, n)) as Score;

/**
 * clamp(1..5) of: base from the alert's severity (low 1, medium 2, high 3),
 * +1 if ≥ 3 distinct rules hit the client, +1 if risk category is elevated or deviation > 10×,
 * +1 if there is a pass-through to a risk-tier country, −1/−2 for mitigating evidence.
 */
export function scoreAlert(
  hit: RuleHit,
  client: ClientProfile,
  clientHits: RuleHit[],
  mitigations: MitigatingFact[],
): ScoreBreakdown {
  const base = SEVERITY_BASE[hit.severity];
  const factors: ScoreBreakdown['factors'] = [];
  const distinct = [...new Set(clientHits.map((h) => h.ruleId))];
  if (distinct.length >= 3) {
    factors.push({
      label: `${distinct.length} different rules hit this client (${distinct.map((r) => RULE_META[r].short).join(', ')})`,
      delta: 1,
    });
  }
  const deviation = maxDeviation(clientHits);
  if (client.riskCategory === 'elevated') {
    factors.push({
      label: `Client risk category "${client.riskCategoryLabel}" (elevated)`,
      delta: 1,
    });
  } else if (deviation > 10) {
    factors.push({
      label: `Activity reached ${deviation.toFixed(1)}× the expected monthly volume`,
      delta: 1,
    });
  }
  const riskCountries = passThroughRiskCountries(clientHits);
  if (riskCountries.length > 0) {
    const names = riskCountries.map(
      (c) => `${countryName(c)} (${COUNTRY_TIER_LABEL[countryRiskTier(c)]})`,
    );
    factors.push({ label: `Pass-through to ${names.join(', ')}`, delta: 1 });
  }
  const deduction = mitigationDeduction(mitigations);
  if (deduction > 0) factors.push({ label: 'Mitigating evidence', delta: -deduction });
  return { base, factors, score: clamp(base + factors.reduce((s, f) => s + f.delta, 0)) };
}
