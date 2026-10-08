# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The AML transaction monitoring prototype was built from a fixed implementation plan ([`docs/IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md)). During the build, several decisions were taken that the plan prescribed, left open, or had to be adjusted. Reviewers need to see what was decided and why.

## Decision

Architecture decisions are recorded as short Markdown ADRs in `docs/adrs/`, numbered sequentially, using this structure: Status, Date, Context, Decision, Consequences, and optionally Alternatives considered. `docs/adrs/README.md` is the index. An ADR is never rewritten after acceptance; a change of mind is recorded in a new ADR that supersedes the old one.

## Consequences

- Deviations from the implementation plan are traceable (see ADR-0003, ADR-0009, ADR-0015, ADR-0018).
- New contributors read the index instead of reverse-engineering the code.
