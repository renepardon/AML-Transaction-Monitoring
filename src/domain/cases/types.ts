import type { Actor } from '../actors';

export type CaseStatus = 'open' | 'in_review' | 'closed_false_positive' | 'escalated';

export interface CaseNote {
  id: string;
  text: string;
  actor: Actor;
  at: string;
}

export interface ChatMessage {
  id: string;
  role: 'analyst' | 'ai';
  text: string;
  actor: Actor;
  at: string;
}

export interface CaseDecision {
  type: 'closed_false_positive' | 'escalated';
  reason: string;
  actor: Actor;
  at: string;
}

export interface CaseRecord {
  id: string;
  clientId: string;
  alertIds: string[];
  /** Max triage score of the case's alerts. */
  score: number;
  status: CaseStatus;
  notes: CaseNote[];
  conversation: ChatMessage[];
  decision?: CaseDecision;
  /** Earlier decisions that were reopened. */
  history: (CaseDecision & { reopenedBy: Actor; reopenReason: string; reopenedAt: string })[];
  openedAt: string;
  updatedAt: string;
}

export const isDecided = (status: CaseStatus) =>
  status === 'closed_false_positive' || status === 'escalated';
