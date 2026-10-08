# ADR-0020: CI/CD pipeline and supply-chain security on GitHub Actions

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The repository is hosted on GitHub. Every change must be checked automatically for integrity, quality and security: tests, build, Docker image, SAST, DAST, secret scanning and Trivy as the minimum. Dependency updates and vulnerability fixes must arrive as pull requests without manual work. The pipeline itself is part of the attack surface (a compromised action or tool image runs with repository access), so it must be pinned and least-privileged.

## Decision

### Workflows (`.github/workflows/`)

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | push to `main`, pull requests, manual | **verify:** `npm ci --ignore-scripts`, `npm audit signatures` (registry signatures and provenance), `npm audit --audit-level=low`, lint, typecheck, tests, build. **dependency-review** (PRs only): fails on any new vulnerable dependency and on strong-copyleft licences (AGPL, GPL-3.0, SSPL). |
| `security.yml` | push, PRs, weekly, manual | **SAST:** CodeQL with `security-extended` for `javascript-typescript` and `actions` (workflow injection). **Secrets:** TruffleHog over the full git history (verified and unverified findings fail the job). **Trivy repo scan:** dependencies, secrets and misconfigurations (Dockerfile); HIGH/CRITICAL fail the job, and SARIF goes to code scanning. |
| `container.yml` | push, PRs, weekly, manual | Builds the image, then:<ul><li>verifies the hardening (user `65532:65532`, no shell)</li><li>starts the container with the production flags (`--read-only`, tmpfs, `--cap-drop=ALL`, `no-new-privileges`)</li><li>runs the smoke test (`.github/scripts/smoke-test.sh`: status codes, required security headers on 200/404/405 responses, no server version, immutable asset caching)</li><li>runs the **DAST** ZAP baseline scan</li><li>runs the **Trivy image scan** (HIGH/CRITICAL with a fix available fail the job; SARIF to code scanning)</li><li>creates a CycloneDX **SBOM**</li></ul>Reports are uploaded as an artifact. |

The weekly schedules catch vulnerabilities published after the last change. This matters most for the base image's libraries.

### Pinning (integrity of the pipeline)

**Actions** are pinned to the full 40-character commit SHA, with the release tag as a comment, for example `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`. GitHub's `uses:` accepts a single ref only; the SHA is the immutable reference and the comment carries the tag. Dependabot updates both together.

**Tool images** (Trivy, TruffleHog, ZAP) are run as containers instead of through wrapper actions:
- Wrapper actions resolve tools by mutable versions (trufflehog-action defaults to `latest`), and trivy-action downloads a binary at runtime.
- The images are listed in `.github/tool-images/Dockerfile` as `FROM image:tag@sha256:… AS <name>`. That file is never built; it exists so Dependabot's docker ecosystem updates tag and digest.
- Workflows read the reference by stage name and pass it through an environment variable, never interpolated into shell code.

**App and base images:** the app Dockerfile uses plain `FROM image:tag@sha256:…` lines (no `ARG` indirection), because Dependabot cannot update image references hidden behind build arguments.

**Runner:** `ubuntu-24.04`, not `ubuntu-latest`.

### Least privilege and hardening

- `permissions: {}` at workflow level. Every job grants only what it needs: `contents: read`, plus `security-events: write` for SARIF upload and `actions: read` for CodeQL.
- `actions/checkout` runs with `persist-credentials: false`, so the token is not left in `.git/config`.
- Every job starts with `step-security/harden-runner` in `egress-policy: audit` mode, which logs outbound connections as a baseline for a later `block` policy.
- Untrusted values never enter `run:` scripts through `${{ }}` interpolation; they go through `env:`. CodeQL's `actions` analysis checks this.
- Every job has a timeout, and concurrency cancels superseded PR runs.

### Gates and noise control

- **npm audit:** any known vulnerability fails the build.
- **Dependency review:** blocks PRs that introduce a vulnerability of any severity.
- **Trivy:** fails on HIGH/CRITICAL with a fix available (`--ignore-unfixed`). All findings, including LOW (e.g. the deliberate missing `HEALTHCHECK`, ADR-0019), are still reported to code scanning.
- **ZAP baseline:** runs with `-I` and `.github/zap/rules.tsv`. Missing or weak security headers (anti-clickjacking, `nosniff`, CSP, Permissions-Policy, cross-origin isolation, server version, X-Powered-By, permissive CORS) are `FAIL`. CSP `style-src 'unsafe-inline'` is a documented `WARN` (ADR-0019). Other alerts are reported without failing.

### Dependency and vulnerability updates (`.github/dependabot.yml`)

Dependabot is used because it works out of the box on GitHub. Renovate would need a GitHub App installation.

- **Ecosystems:** `npm` (minor and patch grouped, majors as separate PRs), `github-actions` (grouped), and `docker` for both `/` and `/.github/tool-images`. All run weekly on Monday.
- **Cooldown:** 3 days before adopting new versions, 7 days for npm majors. This protects against freshly published malicious releases. It does not apply to security updates.
- **Security updates** are opened immediately and are not grouped with version updates. This requires *Dependabot alerts* and *Dependabot security updates* to be enabled in the repository settings.
- **Ignored majors:** the `node` build image (staying on the Node 24 LTS line, ADR-0021). Moving to the next LTS is a deliberate decision, not an automatic bump. The former ignore for `vite` majors was removed with ADR-0021.

### Required repository settings (not expressible in files)

- Dependabot alerts and Dependabot security updates
- Secret scanning with push protection
- Code scanning: CodeQL results and SARIF uploads. Private repositories require GitHub Advanced Security (GitHub Code Security).
- Actions setting "Require actions to be pinned to a full-length commit SHA"
- Branch protection or ruleset on `main` requiring the `CI`, `Security` and `Container` checks and a pull request review

## Alternatives considered

- **Renovate:** more flexible (it can update digests anywhere, including workflow YAML), but needs the Renovate GitHub App or a self-hosted runner. It can replace Dependabot later without changing the pinning scheme.
- **trivy-action and trufflehog-action:** convenient, but they resolve tool versions at runtime, which is weaker than an image pinned by digest. Wrapper actions are also a known supply-chain target.
- **zaproxy/action-baseline:** works, but defaults to the mutable `stable` image tag and opens GitHub issues by default. Running the pinned ZAP image directly gives the same scan with less surface.
- **Semgrep or SonarCloud for SAST:** CodeQL is native to GitHub, free for public repositories, and covers both TypeScript and workflow files.
- **Pushing and signing images (GHCR, cosign, build provenance):** out of scope while there is no deployment target. The pipeline builds and verifies the image locally; push, signing and attestations should be added together with a registry.

## Consequences

- A PR that breaks tests, introduces a vulnerable dependency, leaks a secret, weakens security headers or ships a vulnerable library in the image cannot pass the checks.
- **Verified locally before commit:**
  - `actionlint` passes for all workflows, and the YAML parses.
  - `npm audit signatures` passes with npm 10.9 (the version used in CI).
  - Trivy 0.75.0 reports no HIGH/CRITICAL findings for the repository. It found a HIGH pcre2 CVE in the official nginx image, which led to the `apk upgrade` step in ADR-0019.
- The workflows themselves have not run yet. The first push will be their real test.
- Pinned SHAs and digests age. Dependabot keeps them current, and reviewers must check that a bumped action or image comes from the expected upstream.
- npm 10.1 (the local dev setup) fails `npm audit signatures` because of a bug with expired registry keys. CI uses Node 22 with npm 10.9 and is not affected.
