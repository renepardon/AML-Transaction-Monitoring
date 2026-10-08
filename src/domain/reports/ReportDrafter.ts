import type { Actor } from '../actors';
import type { CaseRecord } from '../cases/types';
import type { RuleConfig, RuleHit } from '../rules/types';
import type { TriageResult } from '../triage/TriageProvider';
import type { ClientProfile, MonthlyAggregate, Statement, Transaction } from '../types';

export interface ReportSection {
  id: string;
  title: string;
  body: string;
}

export interface ReportInput {
  caseRecord: CaseRecord;
  client: ClientProfile;
  alerts: { id: string; hit: RuleHit; triage?: TriageResult }[];
  transactions: Transaction[];
  monthly: MonthlyAggregate[];
  statements: Statement[];
  config: RuleConfig;
  reportingOfficer: Actor;
  auditRange: { fromSeq: number; toSeq: number; fromHash: string; toHash: string } | null;
  generatedAt: string;
}

export interface ReportChunk {
  sectionId: string;
  text: string;
}

/** Produces report sections chunk by chunk. A real LLM adapter streams through the same interface. */
export interface ReportDrafter {
  readonly id: string;
  sections(input: ReportInput): { id: string; title: string }[];
  draft(input: ReportInput): AsyncIterable<ReportChunk>;
}

export const DRAFT_BANNER = 'Draft for human review – not submitted';
