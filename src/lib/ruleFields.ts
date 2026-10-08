import type { RuleConfig, RuleId } from '@/domain/rules/types';

type Section = Exclude<keyof RuleConfig, 'caseScoreThreshold'>;

export interface RuleFieldDef {
  key: string;
  label: string;
  step: number;
  unit?: string;
}

export const RULE_SECTIONS: { ruleId: RuleId; section: Section; fields: RuleFieldDef[] }[] = [
  {
    ruleId: 'R1_STRUCTURING',
    section: 'structuring',
    fields: [
      { key: 'thresholdChf', label: 'Identification threshold', step: 1000, unit: 'CHF' },
      { key: 'bandRatio', label: '"Just below" band from', step: 0.05, unit: '× threshold' },
      { key: 'minCount', label: 'Min. deposits', step: 1 },
      { key: 'windowDays', label: 'Rolling window', step: 1, unit: 'days' },
      { key: 'highCount', label: 'High severity from', step: 1, unit: 'deposits' },
      { key: 'highSumMultiple', label: 'High severity if sum >', step: 0.5, unit: '× threshold' },
    ],
  },
  {
    ruleId: 'R2_PASS_THROUGH',
    section: 'passThrough',
    fields: [
      { key: 'minCreditChf', label: 'Min. credit', step: 5000, unit: 'CHF' },
      { key: 'inflowMultiple', label: 'or ≥', step: 0.5, unit: '× expected inflow' },
      { key: 'windowDays', label: 'Paid out within', step: 1, unit: 'days' },
      { key: 'minOutRatio', label: 'Min. paid-out share', step: 0.05 },
      { key: 'highRatio', label: 'High severity from share', step: 0.01 },
      { key: 'highDays', label: 'High severity within', step: 1, unit: 'days' },
    ],
  },
  {
    ruleId: 'R3_PROFILE_DEVIATION',
    section: 'profileDeviation',
    fields: [
      { key: 'multiple', label: 'Deviation >', step: 0.5, unit: '× expected' },
      { key: 'minExcessChf', label: 'and excess ≥', step: 1000, unit: 'CHF' },
      { key: 'highMultiple', label: 'High severity >', step: 0.5, unit: '× expected' },
    ],
  },
  {
    ruleId: 'R4_RISK_COUNTRY',
    section: 'riskCountry',
    fields: [
      { key: 'unexpectedMinChf', label: 'Unexpected country from', step: 1000, unit: 'CHF' },
    ],
  },
  {
    ruleId: 'R5_PURPOSE_MISMATCH',
    section: 'purposeMismatch',
    fields: [{ key: 'minChf', label: 'Min. amount', step: 1000, unit: 'CHF' }],
  },
];
