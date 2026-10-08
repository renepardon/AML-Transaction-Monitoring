# ADR-0018: Zero npm audit vulnerabilities, with vitest upgraded to 4.1.11

- **Status:** Accepted (updates ADR-0003 for Vitest)
- **Date:** 2026-10-06

## Context

No `npm audit` vulnerabilities are allowed. An audit reported 6 findings:
- **2 critical:** tinypool ≤ 2.1.1 (prototype pollution leading to RCE), pulled in by vitest 3.
- **1 moderate:** `@vitest/mocker` ≤ 4.1.10 (path traversal).
- **3 high:** `underscore` via packages named `audit` and `fix`. These had been added to `package.json` by accident, most likely by typing `npm install audit fix` instead of `npm audit fix`.

`npm audit fix --force` proposed vitest 5, which requires Node ≥ 22.12 (ADR-0003).

## Decision

- **Remove the accidental `audit` and `fix` packages.**
- **Upgrade vitest to `^4.1.11`.** It supports Node 20 and Vite 6, ships the patched `@vitest/mocker` 4.1.11, and no longer depends on tinypool. This is the smallest change that clears all findings.
- **One-off install with a newer npm:** npm 10.1.0 crashes on vitest 4's optional peer set (`Cannot read properties of null (reading 'edgesOut')` in arborist `#loadPeerSet`). The lockfile was therefore generated once with `npx npm@10.9.4 install`. The global npm was not changed, and plain `npm install` works with the resulting lockfile.
- **Node types for the test setup:** vitest 4 no longer pulls in `@types/node` transitively, so `src/test/setup.ts` declares `/// <reference types="node" />`. The app's type scope is unchanged.

## Consequences

- `npm audit` reports 0 vulnerabilities, and all tests, typecheck, lint and build pass.
- Adding dependencies requires a passing `npm audit` before merge.
- Upgrading the global npm (≥ 10.9) or Node (≥ 22) avoids the arborist bug for future installs.
