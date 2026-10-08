# ADR-0009: Simulated "Claude" triage behind a provider interface

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

No external API may be called (ADR-0002), but the demo must show an AI that explains and scores each alert in 2–3 sentences. A real model must be pluggable later without touching the UI.

## Decision

**Provider interface and default:**
- `TriageProvider` (`domain/triage/TriageProvider.ts`) is the only contract the app uses.
- The default `MockClaudeProvider` is local and deterministic, with a simulated latency of 400–900 ms seeded by the alert id.
- Providers are registered in `services/triageProvider.ts`; tests install an instant one.

**Scoring:** clamp(1..5) of the following:
- base from severity: low 1, medium 2, high 3
- +1 if ≥ 3 distinct rules hit the client
- +1 if the risk category is elevated, or the deviation is > 10×
- +1 if there is a pass-through to a risk-tier country
- −1 or −2 for mitigating evidence

**Mitigating evidence** is split into two strengths:
- *Strong:* known salary payer, a Lohn/Bonus/Salär remittance (including a bonus within the 30 days before), a domestic contract reference.
- *Supporting:* a one-off amount below six monthly incomes in an expected country, all non-cash counterparties in expected countries.
- Supporting facts only count together with a strong fact: −1, or −2 when there are ≥ 3 facts. This keeps structured cash deposits (all CH) from being "mitigated".

**Explanations:**
- They come from per-rule sentence templates filled with real amounts, dates, counterparties and profile facts.
- They never use pronouns for clients.
- A tested `enforceSentenceLimit` guard keeps them at 2–3 sentences.
- They are always labelled "AI-generated · simulated Claude · decision stays with the analyst".

**Headline explanation:** a case's alerts are ordered by score, severity, rule priority (R2, R1, R3, R5, R4) and earliest period. The first alert's explanation is the case headline.

**Follow-up questions:** they are answered by keyword intent (countries, timeline, profile, why score, similar cases).

**Deviation from the plan:** Sara Huber (C1006) scores **1**, not the table's 2. The plan's own formula (medium base 2, minus mitigation) cannot produce 2 once any mitigation applies. The acceptance test requires ≤ 2, and the outcome (triage queue, close as false positive) is unchanged.

## Consequences

- Outputs are reproducible and testable.
- The mock cannot reason beyond its templates. This limitation is documented in the README.
- No Anthropic adapter is shipped. Plugging one in requires a backend proxy (no API key in the browser), a CSP `connect-src` change, and registration behind a feature flag.
