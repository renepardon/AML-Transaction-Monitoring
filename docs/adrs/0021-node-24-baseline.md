# ADR-0021: Node 22 minimum, Node 24 recommended

- **Status:** Accepted
- **Date:** 2026-10-08
- **Supersedes:** the Node 20.9 baseline in [ADR-0003](0003-tech-stack-and-toolchain.md)

## Context

ADR-0003 set Node 20.9 as the baseline because of the original development machine. Node 20 is end of life, several dev dependencies print `EBADENGINE` warnings on it, and npm 10.1 fails `npm audit signatures` (ADR-0020). For an open source project, contributors should get a current LTS by default.

## Decision

- **Minimum supported version: Node 22.** It is declared in `package.json` `engines` (`>=22`), and `@types/node` follows the minimum (`^22`), so code cannot use APIs that Node 22 lacks.
- **Recommended version: Node 24 (Active LTS).** `.nvmrc` contains `24`, and the container build stage uses `node:24-alpine`, pinned by digest.
- **CI tests both:** the `CI` workflow runs on a matrix of Node 22 and 24.
- **Vite stays on 6 for now**, but the reason to hold it back is gone. Vite 7 needs Node ≥ 20.19, which the new minimum satisfies. The Dependabot ignore for Vite majors is removed, so a Vite 7 update arrives as a separate, reviewable PR.

## Consequences

- Verified before the switch: `npm ci`, `npm audit signatures`, `npm audit`, lint, typecheck, tests and build pass on Node 22 and on Node 24, and the Docker image builds with `node:24-alpine`.
- Contributors on Node 20 must upgrade. npm warns about the `engines` mismatch but does not block the install, unless `engine-strict` is set.
- Dependabot keeps the build image on the Node 24 line and treats a move to the next LTS as a deliberate decision.
