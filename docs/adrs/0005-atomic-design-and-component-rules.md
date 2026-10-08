# ADR-0005: Atomic design and component rules

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The plan requires atomic design, small components (one per file, at most about 120 lines, hard limit 150), no god components, and a colocated test for every atom, molecule and organism.

## Decision

- **Atoms and molecules are pure:** props in, callbacks out. They never import stores or services (type-only imports are allowed).
- **Organisms** may read selectors and call service functions.
- **Templates** (`AppShell`, `PageTemplate`, `SplitViewTemplate`) provide layout only. `SplitViewTemplate` takes labels, so it serves both Cases and Reports.
- **Pages only compose templates and organisms.** When the Audit and Settings pages called stores and services directly, those actions were moved into the organisms `AuditExportButton` and `SettingsActions`.
- **Navigation is a `view` value in `useUiStore`** (no router), and pages are mapped in `App.tsx`.
- **Hotkeys are small render-less organisms** (`CaseHotkeys`, `GlobalHotkeys`) built on `lib/keyboard.ts`. Plain keys are ignored while typing or while a dialog is open; `mod+` keys always fire.
- **Formatting goes through `lib/format.ts`, `lib/metrics.ts` and `lib/risk.ts`.**

## Consequences

- The largest component file has about 110 lines.
- Every component has a colocated `*.test.tsx`.
