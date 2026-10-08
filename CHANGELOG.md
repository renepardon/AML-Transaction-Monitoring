# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Community files: contributing guide, security policy, code of conduct, issue and pull request templates, CODEOWNERS.
- `.nvmrc`, `.editorconfig` and an `npm run format:check` script, which CI now runs.

### Changed

- Node 22 is now the minimum and Node 24 the recommended version. CI tests on both, and the container build uses `node:24-alpine` (ADR-0021).
- Project renamed to AML Suspicious Transaction Monitoring.

### Removed

- Exercise material that was not part of the application (`docs/Exercise_3_Suspicious_Activity_Data*`).

## [0.1.0] - 2026-10-08

### Added

- First version: camt.053 ingestion, detection rules R0–R5, simulated Claude triage, case list with close and escalate decisions, report drafting with four-eyes approval, hash-chained audit log, hardened container and CI/CD.

[Unreleased]: https://github.com/renepardon/AML-Transaction-Monitoring/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/renepardon/AML-Transaction-Monitoring/releases/tag/v0.1.0
