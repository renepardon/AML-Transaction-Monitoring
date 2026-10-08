# ADR-0003: Tech stack and toolchain versions

- **Status:** Accepted; Node baseline superseded by [ADR-0021](0021-node-24-baseline.md)
- **Date:** 2026-10-06

## Context

The plan prescribes Vite, React 19, TypeScript (`strict`, `noUncheckedIndexedAccess`), shadcn/ui (new-york, neutral), Tailwind CSS v4, Recharts through the shadcn `chart` component, Zustand v5, zod, Vitest with Testing Library, ESLint and Prettier. It forbids a router, axios, date libraries, XML/CSV libraries, immer and other UI kits. The development machine runs **Node 20.9.0** and npm 10.1.0.

## Decision

- Use the prescribed stack and none of the forbidden libraries. XML is parsed with `DOMParser`, CSV with an in-house RFC 4180 parser, and dates with small helpers in `src/domain/dates.ts`.
- **Vite is pinned to 6.x**, because Vite 7 requires Node ≥ 20.19. `@vitejs/plugin-react` 4.x and jsdom 26 are chosen for the same reason.
- Vitest started on 3.x and was later raised to 4.1.11 for security reasons (ADR-0018).
- zod 3.25 is used. Its API is stable, and nothing in the plan needs zod 4.
- `@/` is the path alias for `src/`.

## Consequences

- The project builds and tests on Node 20.9. Upgrading Node to ≥ 20.19 (or 22) would allow Vite 7 later.
- Some dev dependencies print `EBADENGINE` warnings on Node 20.9 (e.g. `@testing-library/jest-dom` 7). They work, but upgrading Node removes the warnings.
