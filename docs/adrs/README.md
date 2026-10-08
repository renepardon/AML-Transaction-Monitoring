# Architecture Decision Records

Decisions behind AML Suspicious Transaction Monitoring (Scenario A). Format and process: [ADR-0001](0001-record-architecture-decisions.md). Each ADR records its context, the decision and its consequences, plus alternatives considered where relevant.

| # | Title | Status | Date |
|---|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-10-06 |
| [0002](0002-client-only-architecture.md) | Client-only architecture with bundled sample data | Accepted | 2026-10-06 |
| [0003](0003-tech-stack-and-toolchain.md) | Tech stack and toolchain versions | Accepted (Node baseline superseded by 0021) | 2026-10-06 |
| [0004](0004-zustand-single-source-of-truth.md) | Zustand as single source of truth, with services as the only cross-store writers | Accepted | 2026-10-06 |
| [0005](0005-atomic-design-and-component-rules.md) | Atomic design and component rules | Accepted | 2026-10-06 |
| [0006](0006-safe-data-ingestion.md) | Safe data ingestion and money as integer Rappen | Accepted | 2026-10-06 |
| [0007](0007-detection-rules.md) | Deterministic detection rules R0–R5 | Accepted | 2026-10-06 |
| [0008](0008-pipeline-and-idempotency.md) | Pipeline orchestration and idempotent re-runs | Accepted | 2026-10-06 |
| [0009](0009-simulated-claude-triage.md) | Simulated "Claude" triage behind a provider interface | Accepted | 2026-10-06 |
| [0010](0010-cases-and-decision-invariants.md) | Case grouping and decision invariants | Accepted | 2026-10-06 |
| [0011](0011-report-drafting-and-four-eyes.md) | Separate report store, streaming drafter and four-eyes approval | Accepted | 2026-10-06 |
| [0012](0012-hash-chained-audit-log.md) | Append-only, hash-chained audit log | Accepted | 2026-10-06 |
| [0013](0013-persistence.md) | Persistence with versioned localStorage | Accepted | 2026-10-06 |
| [0014](0014-ui-design-and-accessibility.md) | UI design language and accessibility | Accepted | 2026-10-06 |
| [0015](0015-shadcn-integration.md) | shadcn/ui integration details | Accepted | 2026-10-06 |
| [0016](0016-testing-strategy.md) | Testing strategy | Accepted | 2026-10-06 |
| [0017](0017-bundling.md) | Bundle splitting and size budget | Accepted | 2026-10-06 |
| [0018](0018-dependency-security.md) | Zero npm audit vulnerabilities, with vitest upgraded to 4.1.11 | Accepted | 2026-10-06 |
| [0019](0019-secure-container-deployment.md) | Secure container deployment: self-built distroless nginx, non-root, read-only | Accepted | 2026-10-06 |
| [0020](0020-ci-cd-and-supply-chain-security.md) | CI/CD pipeline and supply-chain security on GitHub Actions | Accepted | 2026-10-06 |
| [0021](0021-node-24-baseline.md) | Node 22 minimum, Node 24 recommended | Accepted | 2026-10-08 |

## Where the implementation deviates from the plan

- [ADR-0003](0003-tech-stack-and-toolchain.md): Vite pinned to 6 because the machine ran Node 20.9. The Node baseline is now 22/24 ([ADR-0021](0021-node-24-baseline.md)); Vite 7 can follow as a separate update.
- [ADR-0009](0009-simulated-claude-triage.md): Sara Huber (C1006) scores 1 instead of 2. No Anthropic adapter is shipped.
- [ADR-0015](0015-shadcn-integration.md): the generated chart uses `dangerouslySetInnerHTML`, and `next-themes` is kept as a shadcn dependency.
- [ADR-0018](0018-dependency-security.md): vitest 4.1.11 instead of 3.x.

## Adding an ADR

Copy the structure of an existing ADR, use the next number, set the status (`Proposed`, `Accepted`, `Superseded by ADR-XXXX`), and add a row to the table above.
