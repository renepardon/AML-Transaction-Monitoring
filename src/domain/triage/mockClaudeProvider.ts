import { seededUnit } from '../ids';
import { composeExplanation } from './explanationTemplates';
import { detectMitigations, mitigationDeduction } from './mitigation';
import { scoreAlert } from './scoring';
import { enforceSentenceLimit } from './sentences';
import type { TriageInput, TriageProvider, TriageResult } from './TriageProvider';

export const MOCK_MODEL = 'mock-claude-local-v1';

/** Simulated latency of 400–900 ms, seeded by the alert id (deterministic). */
export function simulatedLatency(alertId: string): number {
  return Math.round(400 + seededUnit(alertId) * 500);
}

/** Pure part of the mock: the same input always yields the same score, facts and text. */
export function composeTriage(
  input: TriageInput,
  latencyMs: number,
  generatedAt: string,
): TriageResult {
  const mitigations = detectMitigations(input.hit, input.client, input.transactions);
  const breakdown = scoreAlert(input.hit, input.client, input.clientHits, mitigations);
  const explanation = enforceSentenceLimit(
    composeExplanation({
      hit: input.hit,
      client: input.client,
      clientHits: input.clientHits,
      txById: new Map(input.transactions.map((t) => [t.id, t])),
      mitigations,
      mitigated: mitigationDeduction(mitigations) > 0,
    }),
  );
  return {
    alertId: input.alertId,
    score: breakdown.score,
    explanation,
    aggravating: [
      input.hit.summary,
      ...breakdown.factors.filter((f) => f.delta > 0).map((f) => f.label),
    ],
    mitigating: mitigations.map((m) => m.text),
    recommendedAction: breakdown.score >= 3 ? 'open_case' : 'close_suggested',
    model: MOCK_MODEL,
    generatedAt,
    latencyMs,
  };
}

export interface MockClaudeOptions {
  /** 1 = realistic latency, 0 = instant (tests). */
  latencyScale?: number;
  now?: () => Date;
}

export class MockClaudeProvider implements TriageProvider {
  readonly id = 'mock-claude';
  private readonly latencyScale: number;
  private readonly now: () => Date;

  constructor(options: MockClaudeOptions = {}) {
    this.latencyScale = options.latencyScale ?? 1;
    this.now = options.now ?? (() => new Date());
  }

  async triage(input: TriageInput): Promise<TriageResult> {
    const latencyMs = simulatedLatency(input.alertId);
    const wait = latencyMs * this.latencyScale;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return composeTriage(input, latencyMs, this.now().toISOString());
  }
}
