# Security policy

## Supported versions

This project is a prototype without releases on a support schedule. Security fixes go into `main` only.

| Version        | Supported |
| -------------- | --------- |
| `main`         | Yes       |
| anything older | No        |

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Report it privately through [GitHub security advisories](https://github.com/renepardon/AML-Transaction-Monitoring/security/advisories/new). Please include:

- what is affected (file, component, container image or workflow)
- steps to reproduce, or a proof of concept
- the impact you expect, and any idea for a fix

You can expect an acknowledgement within 5 working days and an assessment within 14 days. If the report is confirmed, we fix it, publish an advisory, and credit you unless you prefer not to be named.

## Scope

In scope:

- the application code in `src/` (for example, injection through uploaded camt.053 or CSV files, bypassing the audit hash chain or the four-eyes rule)
- the container image and nginx configuration (`Dockerfile`, `docker/`)
- the GitHub Actions workflows and supply chain (`.github/`)

Out of scope:

- the fictional sample data
- results of automated scanners without a demonstrated impact
- the fact that the AI triage is simulated. This is documented and intended.

This is not a certified AML system. Do not use it with real customer data.
