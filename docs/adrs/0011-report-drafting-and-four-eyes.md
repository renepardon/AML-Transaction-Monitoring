# ADR-0011: Separate report store, streaming drafter and four-eyes approval

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

Escalated cases need a suspicious activity report draft. The plan requires a separate Zustand store so the drafting lifecycle is visible, an MROS-like structure (Art. 9 GwG, goAML), and four-eyes approval.

## Decision

**Store and lifecycle:**
- `useReportStore` holds one draft per case, with the lifecycle `queued → generating → draft → in_review → approved | rejected`, plus progress, streamed text and a version counter.
- Every completion and every section edit bumps the version, and edits are audited with before and after text.
- A new draft is only allowed after a rejection.

**Drafting:**
- `ReportDrafter` is an interface.
- `MockReportDrafter` builds 9 sections from `mrosTemplate.ts` and streams them in word-boundary chunks (about 30 ms each).
- The section structure is: institution, subject, summary, transactions table with `AcctSvcrRef`, profile comparison, red flags with cited thresholds, clarifications, measures, and attachments with the audit hash range.
- Markdown table cells are formula-injection safe.

**Generation runs in the background:**
- `requestDraft` returns after queueing, so the escalation dialog closes immediately.
- In-flight generations are tracked so tests and "Reset demo" can await them.
- Generation stops quietly if its draft disappears mid-stream.

**Four-eyes:**
- The escalating analyst (`requestedBy`) cannot approve or reject the report.
- Two seed analysts (A. Keller, M. Rossi) can be switched in the top bar, and each switch is audited.
- The review dialog warns before the `FOUR_EYES` error is raised.

**Export:** "Copy as Markdown" and "Print / Save as PDF" (print stylesheet, no PDF library). Every draft carries the banner "Draft for human review – not submitted".

## Consequences

- The demo shows the draft being written live and approved by a second person.
- The actor switcher is a demo stand-in for real authentication.
