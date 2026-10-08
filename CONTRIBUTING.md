# Contributing

Thanks for your interest in AML Suspicious Transaction Monitoring. Bug reports, ideas and pull requests are all welcome.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Please report security problems privately as described in [SECURITY.md](SECURITY.md), never in a public issue.

## Before you start

- **Small fixes** (typos, small bugs, tests) can go straight to a pull request.
- **Larger changes** (new rules, new pages, changes to stores or services, new dependencies): please open an issue first, so we can agree on the approach before you spend time on it.
- **Architectural changes** need an ADR in [`docs/adrs/`](docs/adrs/README.md). Copy the structure of an existing ADR, use the next number, and add it to the index.

## Development setup

You need Node 22 or newer. Node 24 is recommended, and `.nvmrc` pins it:

```bash
nvm use            # or: fnm use / volta, any version manager that reads .nvmrc
npm ci
npm run dev        # http://localhost:5173, sample data already loaded
```

The app has no backend and makes no network calls at runtime, so there is nothing else to set up.

## Checks

CI runs these on Node 22 and 24, and a pull request has to pass all of them. Run them locally first:

```bash
npm run format:check   # npm run format fixes it
npm run lint
npm run typecheck
npm test
npm run build
```

CI also runs `npm audit` (any known vulnerability fails), CodeQL, secret and Trivy scans, and builds and scans the container. See [ADR-0020](docs/adrs/0020-ci-cd-and-supply-chain-security.md).

## Conventions

The ADRs hold the reasoning. The rules you are most likely to run into:

- **State:** Zustand is the single source of truth. Only services in `src/services` write across stores, and no store imports another ([ADR-0004](docs/adrs/0004-zustand-single-source-of-truth.md)).
- **Components:** atomic design. Atoms and molecules are pure, organisms read selectors and call services, and pages only compose ([ADR-0005](docs/adrs/0005-atomic-design-and-component-rules.md)). `src/components/ui` is generated shadcn code; don't edit it by hand.
- **Domain code** in `src/domain` is pure TypeScript with no React and no store access. Detection rules are pure functions `(ctx) => RuleHit[]` and must not hard-code client ids or names.
- **Money** is integer Rappen; never `parseFloat` an amount ([ADR-0006](docs/adrs/0006-safe-data-ingestion.md)).
- **No `dangerouslySetInnerHTML`** and no network calls in application code.
- **Tests:** new behaviour comes with tests next to the code (`*.test.ts(x)`). If you change detection or scoring, `src/services/pipeline.acceptance.test.ts` and the table in the README must still agree ([ADR-0016](docs/adrs/0016-testing-strategy.md)).
- **Dependencies:** add as few as possible, and explain why in the PR. Lifecycle scripts are not run (`--ignore-scripts`), and GPL/AGPL/SSPL licenses are rejected by the dependency review.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `ci:`, `deps:`, `chore:`.
- Keep each pull request to one topic, branch from `main`, and fill in the pull request template.
- Add an entry to the `Unreleased` section of [CHANGELOG.md](CHANGELOG.md) for user-visible changes.
- Pull requests are merged after the checks pass and a maintainer has reviewed them.

## Sample data

All bundled data in `src/data/samples` is fictional. Do not add real customer, account or transaction data to issues, pull requests or test fixtures, not even anonymised.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
