# ADR-0016: Testing strategy

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

`npm test` must cover parsing, rules, scoring, stores, services and components. The plan's ground-truth table is the definitive acceptance criterion: "if it fails, fix the rules, not the test".

## Decision

- **Pure domain functions** have unit tests with positive, negative and threshold-edge fixtures (e.g. 14'999.99 hits, 15'000.00 does not). Hand-made camt fixtures are built with `test/builders.ts`.
- **The acceptance test** (`services/pipeline.acceptance.test.ts`) runs ingest, detection, triage and cases on the real bundled files. It also asserts the audit sequence, chain integrity and idempotency.
- **Store and service tests** check invariants: reason required, no double decisions, four-eyes, the escalate → draft → audit order, tamper detection, and persist migration.
- **Component tests** exist for every atom, molecule and organism. Organism tests run on the real pipeline output (`test/pipelineFixture.ts`), with an instant triage provider and drafter.
- **Background report generation** is awaited after every test (`afterEach` in `test/setup.ts`), so store resets never race with generation.
- **jsdom gaps** are filled in `test/setup.ts`: WebCrypto fallback, `ResizeObserver`, `matchMedia`, pointer capture and `scrollIntoView`.

## Consequences

- 237 tests run in about 4 seconds.
- Visual and layout regressions are not covered by automated tests.
