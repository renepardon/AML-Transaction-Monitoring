import type { RuleHit } from '../rules/types';
import type { ClientProfile, MonthlyAggregate, Transaction } from '../types';

export type Score = 1 | 2 | 3 | 4 | 5;

export interface TriageInput {
  alertId: string;
  hit: RuleHit;
  client: ClientProfile;
  /** Every rule hit for the same client (context for the explanation). */
  clientHits: RuleHit[];
  /** The client's transactions, all months, sorted by booking date. */
  transactions: Transaction[];
  monthly: MonthlyAggregate[];
}

export type TriageResult = {
  alertId: string;
  score: Score;
  /** Exactly 2–3 sentences, plain text. */
  explanation: string;
  aggravating: string[];
  mitigating: string[];
  recommendedAction: 'open_case' | 'close_suggested';
  model: string;
  generatedAt: string;
  latencyMs: number;
};

/** A real LLM adapter implements the same interface; the UI never knows the difference. */
export interface TriageProvider {
  readonly id: string;
  triage(input: TriageInput): Promise<TriageResult>;
}

export const SCORE_LABEL: Record<Score, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very high',
};
