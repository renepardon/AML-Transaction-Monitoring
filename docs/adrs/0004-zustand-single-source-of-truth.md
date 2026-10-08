# ADR-0004: Zustand as single source of truth, with services as the only cross-store writers

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

All domain and UI state must live in Zustand (no domain data in `useState`, Context or module variables). Stores must not import each other, to avoid circular dependencies and hidden coupling.

## Decision

- **One store per concern** in `src/stores/`: `useDataStore`, `useRuleConfigStore`, `useAlertStore`, `useCaseStore`, `useReportStore` (separate, see ADR-0011), `useAuditStore`, `useSessionStore` and `useUiStore`.
- **Stores hold state and thin actions** that enforce invariants (e.g. reason validation, ADR-0010). Business logic lives in pure `src/domain` code.
- **Cross-store orchestration happens only in `src/services/*`** via `useXStore.getState()`: `pipeline`, `ingest`, `decisions`, `reporting`, `audit`, `settings` and `session`. The pure ingest functions in `services/ingest.ts` import no store, so `useDataStore` can call them without a cycle.
- **The pipeline imports `useCaseStore` directly** for its case stage. An earlier draft used runtime registration hooks for this; they were replaced because services may depend on any store, and only service-to-service cycles must be avoided.
- **Derived data is never stored.** It is computed in selector hooks in `src/stores/selectors/*` (with `useMemo` and `useShallow`). The only intentional exception is `case.score`, which the plan lists explicitly.
- **Selectors never return fresh empty arrays or objects.** They use the shared `EMPTY_ARRAY` and `EMPTY_OBJECT` constants, because `?? []` created a new reference per render and caused an infinite re-render loop.
- **Dialog state and form drafts (reasons, notes, questions, section edits, settings inputs) live in `useUiStore`.** `useState` is used only for purely visual state (the drag-over highlight).
- **Module-level state is allowed only for infrastructure,** never for domain data: the audit append queue, the provider/drafter registry, the in-flight report generations and the pipeline run guard.

## Consequences

- Every component can be tested by seeding stores with `setState`.
- `grep` confirms no store imports another store.
- Services form a small dependency graph: `decisions → pipeline, reporting`; `session → pipeline, reporting`; `pipeline → reporting`.
