# ADR-0008: Pipeline orchestration and idempotent re-runs

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The pipeline mirrors the exercise's 8 stages: ingest → detect → triage → open cases → investigate → decide → draft report → audit. Re-running after a config change or a page reload must not duplicate work or lose decisions.

## Decision

- **Single entry point:** `services/pipeline.ts` provides `runPipeline()` (detect → triage → open cases) behind an in-flight guard. `bootstrap()` loads data only once (status `idle`), which makes it safe under React StrictMode.
- **Stable alert ids:** `AL-` + a deterministic FNV-1a hash of rule id + client id + sorted evidence ids. The same data and config always give the same ids.
- **Re-run behaviour:** existing alerts keep their triage, dismissal and promotion. An interrupted triage (`running` after a reload) is reset to `pending`. Alerts that are no longer raised are dropped, unless they are dismissed or referenced by a case.
- **Triage concurrency:** triage runs two alerts at a time, and progress is derived from the per-alert status in the store.
- **Case threshold:** cases open for alerts with score ≥ `caseScoreThreshold` (default 3), or for promoted alerts.
- **Resuming drafts:** after bootstrap, report drafts left in `queued` or `generating` by a reload are restarted.

## Consequences

- A second run on unchanged data only writes one `rules.run` audit entry.
- Changing thresholds and re-running keeps earlier decisions (covered by tests).
