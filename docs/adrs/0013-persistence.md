# ADR-0013: Persistence with versioned localStorage

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

Decisions, drafts and the audit log should survive a reload. The raw dataset should not be persisted, because it is always rebuilt from its sources.

## Decision

- **Shared options:** stores use Zustand `persist` with shared options (`stores/persistConfig.ts`): key prefix `aml-poc:`, `version` and `migrate`, JSON in `localStorage`, and `devtools` in development only.
- **What is persisted:**

  | Persisted | Not persisted |
  |---|---|
  | Rule config, alerts, cases, reports, audit entries plus `anchorHash`, session | `useDataStore` (rebuilt from sources) |
  | `useUiStore`: only `theme` and `view` | Audit verification state |

- **Migration:** `useCaseStore` has a real v0 → v1 migration (it backfills `history` and `conversation`), covered by a rehydrate test.

## Consequences

- A reload re-runs ingest and detection. Existing decisions stay attached thanks to stable alert ids (ADR-0008).
- Future schema changes need a version bump and a migration.
