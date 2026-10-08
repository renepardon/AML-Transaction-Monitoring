import type { ClientProfile, MonthlyAggregate, Transaction } from '../types';

export type RuleId =
  | 'R1_STRUCTURING'
  | 'R2_PASS_THROUGH'
  | 'R3_PROFILE_DEVIATION'
  | 'R4_RISK_COUNTRY'
  | 'R5_PURPOSE_MISMATCH';

export type Severity = 'low' | 'medium' | 'high';

export interface RuleHit {
  ruleId: RuleId;
  clientId: string;
  severity: Severity;
  title: string;
  summary: string;
  evidenceTxIds: string[];
  metrics: Record<string, number | string>;
  period: { from: string; to: string };
}

/** All thresholds in whole CHF (converted to Rappen inside the rules). */
export interface RuleConfig {
  structuring: {
    thresholdChf: number;
    bandRatio: number;
    minCount: number;
    windowDays: number;
    highCount: number;
    highSumMultiple: number;
  };
  passThrough: {
    minCreditChf: number;
    inflowMultiple: number;
    windowDays: number;
    minOutRatio: number;
    highRatio: number;
    highDays: number;
  };
  profileDeviation: { multiple: number; minExcessChf: number; highMultiple: number };
  riskCountry: { unexpectedMinChf: number };
  purposeMismatch: { minChf: number; keywords: string[] };
  caseScoreThreshold: number;
}

export interface RuleContext {
  client: ClientProfile;
  /** All months, sorted by booking date. */
  transactions: Transaction[];
  monthlyAggregates: MonthlyAggregate[];
  config: RuleConfig;
}

export type Rule = (ctx: RuleContext) => RuleHit[];

export const RULE_META: Record<RuleId, { short: string; name: string; description: string }> = {
  R1_STRUCTURING: {
    short: 'R1',
    name: 'Structuring',
    description:
      'Cash deposits just below the CHF 15’000 identification threshold, clustered in 30 days.',
  },
  R2_PASS_THROUGH: {
    short: 'R2',
    name: 'Pass-through',
    description: 'A large credit is paid out again within days, with no apparent business reason.',
  },
  R3_PROFILE_DEVIATION: {
    short: 'R3',
    name: 'Profile deviation',
    description: 'Monthly inflow or outflow far above the expected activity in the client profile.',
  },
  R4_RISK_COUNTRY: {
    short: 'R4',
    name: 'Risk country',
    description:
      'Counterparty in a FATF-listed or internally elevated country, or outside the expected countries.',
  },
  R5_PURPOSE_MISMATCH: {
    short: 'R5',
    name: 'Purpose mismatch',
    description:
      'Payment purpose or counterparty does not fit the client profile, or own-account transfer abroad.',
  },
};

export const RULE_IDS = Object.keys(RULE_META) as RuleId[];
