# ADR-0015: shadcn/ui integration details

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

shadcn components are generated into `src/components/ui` and should not be edited by hand. The CLI ran without a complete `init` step.

## Decision

- **Fixing the generated imports:** the CLI rewrote `@/lib/utils` imports to a bogus npm package named `cn` and installed it. The package was removed, and the imports in `components/ui` were pointed at `@/lib/utils`, which re-exports `cn` from `src/lib/cn.ts`. This import-path fix is the only change made to generated files.
- **Missing pieces added by hand:** `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` and the neutral theme CSS variables.
- **Chart component:** the generated `chart` component injects CSS variables via `dangerouslySetInnerHTML`, using static config only. It is accepted as generated code. The lint rule against `dangerouslySetInnerHTML` applies to application code, where it is never used.
- **Toaster theming:** the generated `sonner` wrapper depends on `next-themes`. The dependency is kept, but the theme is passed explicitly from `useUiStore`, so no `next-themes` provider is used.
- **Tooltips:** the app is wrapped in `TooltipProvider`.

## Consequences

- Regenerating shadcn components may require re-applying the import-path fix.
