import { sampleTriageInputs } from '@/test/sampleTriage';
import type { TriageInput } from './TriageProvider';
import { composeTriage, MockClaudeProvider, simulatedLatency } from './mockClaudeProvider';
import { countSentences } from './sentences';

describe('MockClaudeProvider', () => {
  let inputs: TriageInput[] = [];
  beforeAll(async () => {
    inputs = await sampleTriageInputs();
  });

  it('every explanation on the bundled data has 2–3 sentences', () => {
    for (const input of inputs) {
      const n = countSentences(composeTriage(input, 500, 'x').explanation);
      expect(n, input.alertId).toBeGreaterThanOrEqual(2);
      expect(n, input.alertId).toBeLessThanOrEqual(3);
    }
  });

  it('is deterministic', async () => {
    const provider = new MockClaudeProvider({
      latencyScale: 0,
      now: () => new Date('2026-10-06T10:00:00Z'),
    });
    const a = await provider.triage(inputs[0]!);
    const b = await provider.triage(inputs[0]!);
    expect(a).toEqual(b);
    expect(a.model).toBe('mock-claude-local-v1');
  });

  it('simulates 400–900 ms latency seeded by alert id', () => {
    for (const input of inputs) {
      const ms = simulatedLatency(input.alertId);
      expect(ms).toBeGreaterThanOrEqual(400);
      expect(ms).toBeLessThanOrEqual(900);
    }
  });

  it('reads like an analyst: C1003 pass-through cites amounts, ratio, countries and repetition', () => {
    const input = inputs.find(
      (i) => i.client.clientId === 'C1003' && i.hit.ruleId === 'R2_PASS_THROUGH',
    )!;
    const r = composeTriage(input, 500, 'x');
    expect(r.explanation).toMatch(/CHF\s250.000 from Eastgate Holdings Ltd \(Hong Kong\)/);
    expect(r.explanation).toMatch(/98\.6 %/);
    expect(r.explanation).toMatch(/the United Arab Emirates/);
    expect(r.explanation).toMatch(/September 2026 with CHF\s310.000/);
    expect(r).toMatchObject({ score: 5, recommendedAction: 'open_case' });
  });

  it('suggests closing Sara Huber with mitigating facts', () => {
    const input = inputs.find((i) => i.client.clientId === 'C1006')!;
    const r = composeTriage(input, 500, 'x');
    expect(r.score).toBeLessThanOrEqual(2);
    expect(r.recommendedAction).toBe('close_suggested');
    expect(r.mitigating.join(' ')).toMatch(/Kaufvertrag/);
    expect(r.explanation).toMatch(/false positive/);
  });
});
