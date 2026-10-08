# ADR-0014: UI design language and accessibility

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The UI should be calm and simple ("as simple as Apple would design it"), work in light and dark mode, be keyboard-friendly, and meet AA contrast.

## Decision

**Visual design:**
- One accent colour (`oklch(0.6 0.2 255)`) and neutral greys.
- Muted risk colours (scores 1–2 gray/green, 3 amber, 4–5 red), defined as theme tokens.
- System font stack, tabular numbers, `rounded-2xl` cards, hairline borders, translucent sidebar and top bar.
- 150–200 ms transitions, skeletons while triage runs, a blinking caret while the report streams.

**Accessibility:**
- **A score is never shown by colour alone:** always as a number plus a label ("5 · Very high") with an `aria-label`.
- Country tags carry their tier in the label.
- All interactive elements are focusable, with visible focus rings.

**Keyboard and theme:**
- `⌘K` opens the command palette (navigate, open a case by client name, re-run detection, toggle theme). `J`/`K` move through cases, `E` escalates, `C` closes.
- The theme is stored in `useUiStore` (light/dark/system) and applied by `ThemeProvider`.

**Privacy and states:**
- IBANs are masked in the UI (`CH32 •••• 0001`); the full IBAN appears only in the report.
- Every list has empty, loading and error states.

## Consequences

- The UI was verified with component tests in jsdom. A manual browser check is still recommended before a live demo.
