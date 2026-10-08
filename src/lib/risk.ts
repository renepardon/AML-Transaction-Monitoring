import { SCORE_LABEL, type Score } from '@/domain/triage/TriageProvider';

export type RiskTone = 'low' | 'mid' | 'high';

/** 1–2 gray/green, 3 amber, 4–5 red. Always paired with a number and a label. */
export function riskTone(score: number): RiskTone {
  if (score >= 4) return 'high';
  if (score === 3) return 'mid';
  return 'low';
}

export function scoreLabel(score: number): string {
  return SCORE_LABEL[Math.min(5, Math.max(1, Math.round(score))) as Score];
}

export const TONE_TEXT: Record<RiskTone, string> = {
  low: 'text-risk-low',
  mid: 'text-risk-mid',
  high: 'text-risk-high',
};

export const TONE_BG: Record<RiskTone, string> = {
  low: 'bg-risk-low/12 text-risk-low',
  mid: 'bg-risk-mid/15 text-risk-mid',
  high: 'bg-risk-high/12 text-risk-high',
};
