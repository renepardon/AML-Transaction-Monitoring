import { PURPOSE_KEYWORDS } from '../reference/keywords';
import { CASH_IDENTIFICATION_THRESHOLD_CHF, STRUCTURING_BAND_RATIO } from '../reference/thresholds';
import type { RuleConfig, RuleId } from './types';

export const DEFAULT_RULE_CONFIG: RuleConfig = {
  structuring: {
    thresholdChf: CASH_IDENTIFICATION_THRESHOLD_CHF,
    bandRatio: STRUCTURING_BAND_RATIO,
    minCount: 3,
    windowDays: 30,
    highCount: 5,
    highSumMultiple: 3,
  },
  passThrough: {
    minCreditChf: 50_000,
    inflowMultiple: 2,
    windowDays: 10,
    minOutRatio: 0.8,
    highRatio: 0.95,
    highDays: 3,
  },
  profileDeviation: { multiple: 3, minExcessChf: 10_000, highMultiple: 6 },
  riskCountry: { unexpectedMinChf: 10_000 },
  purposeMismatch: { minChf: 10_000, keywords: [...PURPOSE_KEYWORDS] },
  caseScoreThreshold: 3,
};

export const DEFAULT_ENABLED_RULES: Record<RuleId, boolean> = {
  R1_STRUCTURING: true,
  R2_PASS_THROUGH: true,
  R3_PROFILE_DEVIATION: true,
  R4_RISK_COUNTRY: true,
  R5_PURPOSE_MISMATCH: true,
};
