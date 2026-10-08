import { MockClaudeProvider } from '@/domain/triage/mockClaudeProvider';
import type { TriageProvider } from '@/domain/triage/TriageProvider';

// The local deterministic provider is the default. A real LLM adapter can be registered here
// behind a feature flag without touching the UI (see README "Plugging in a real model").
let provider: TriageProvider = new MockClaudeProvider();

export function getTriageProvider(): TriageProvider {
  return provider;
}

/** Swaps the provider (tests use an instant mock). */
export function setTriageProvider(next: TriageProvider): void {
  provider = next;
}
