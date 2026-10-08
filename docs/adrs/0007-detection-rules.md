# ADR-0007: Deterministic detection rules R0–R5

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

Rules decide what becomes an alert. They must be pure, configurable from the UI, and free of hard-coded client ids or names, and they must reproduce the plan's ground-truth table on the bundled files.

## Decision

Each rule is a pure function `(RuleContext) => RuleHit[]` in `src/domain/rules`. Thresholds are kept in whole CHF in `RuleConfig` (`useRuleConfigStore`) and converted to Rappen inside the rules. Where the plan left implementation details open, the following interpretations were chosen:

| Rule | Interpretation |
|---|---|
| R1 Structuring | All rolling 30-day windows with ≥ 3 in-band deposits (CHF 12'000–14'999.99) are merged into connected clusters. Each cluster is one hit. |
| R2 Pass-through | Debits on the credit day or up to 10 days later are taken **largest first** until they reach 80 %. The ratio and the day count refer to the selected debits. This gives the plan's "98.6 %" for C1003. |
| R3 Profile deviation | One hit per month. It covers inflow, outflow or both, and its severity comes from the larger ratio. Its evidence is that month's transactions in the exceeding direction(s). |
| R4 Risk country | One merged hit per transaction (tier list and/or unexpected country ≥ CHF 10'000). Only FATF lists are high severity. |
| R5 Purpose mismatch | Case-insensitive keyword match on purpose and counterparty, or an own-account transfer abroad (normalised name equality, country ≠ CH). One hit per transaction. |
| R0 Data integrity | Reconciliation, continuity and duplicate warnings. They are data warnings, not AML alerts. |

**Reference data:**
- Thresholds in `domain/reference/thresholds.ts` carry their GwV-FINMA and VSB sources.
- The country lists (FATF, June 2026) and the "Internal risk list – demo policy" are kept separate. The UI never calls HK, AE or EE FATF-listed.

## Consequences

- The bundled files produce the plan's table exactly: C1001, C1002 and C1003 get the expected rules, C1006 gets R3 only, and C1004 and C1005 get nothing.
- The acceptance test enforces this outcome.
