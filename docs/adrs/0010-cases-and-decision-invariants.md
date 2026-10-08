# ADR-0010: Case grouping and decision invariants

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The analyst's decisions are the compliance-relevant output. They must always carry a reason and must not be overwritten silently.

## Decision

- **Grouping:** alerts with score ≥ threshold are grouped into one case per client (`CASE-<clientId>`). The case score is the maximum alert score. Open cases absorb new alerts on re-run; decided cases are left untouched.
- **Reasons:** every decision requires a trimmed reason of ≥ 10 characters (`domain/reason.ts`). This applies to closing, escalating, reopening, dismissing, promoting, and approving or rejecting a report. Otherwise a typed `DomainError` is thrown and shown as a toast.
- **No second decision:** a closed or escalated case cannot be decided again without `reopen`. Reopening keeps the previous decision in `history`.
- **In review:** adding a note or asking a question moves an `open` case to `in_review`.
- **Low-score alerts** stay in the triage queue and can be dismissed (closed as false positive) or promoted to a case, both with a reason.
- **Escalation automatically requests a report draft** (ADR-0011).
- **Submit buttons** stay disabled until the reason is valid, and the dialog shows the actor the decision will be recorded under.

## Consequences

- The false-positive path (C1006) and the escalation path are both demonstrable and audited.
- The reopen history makes reversals visible.
