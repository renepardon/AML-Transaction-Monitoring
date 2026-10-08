# ADR-0002: Client-only architecture with bundled sample data

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The prototype must be demonstrable anywhere, without infrastructure, and must not leak (even fictional) banking data. The plan forbids a backend, a database, external APIs and network calls at runtime.

## Decision

- The app runs entirely in the browser. The three camt.053 files and `client_profiles.csv` are bundled with `?raw` imports (`src/data/sampleData.ts`) and loaded on first start.
- Optional uploads go through exactly the same ingest path (ADR-0006) and **replace** the current dataset instead of merging into it.
- A strict CSP meta tag (`default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'`) is part of `index.html`.
- The source contains no `fetch`, `XMLHttpRequest`, `WebSocket` or `sendBeacon` calls. Exports (CSV, Markdown, print) are client-side only.

## Consequences

- `npm i && npm run dev` is the whole setup, and nothing can be sent anywhere.
- Persistence is limited to `localStorage` (ADR-0013); there is no multi-user state, so the four-eyes demo uses an actor switcher (ADR-0011).
- The app chunk contains about 215 KB of XML (ADR-0017).
- A real LLM needs a backend proxy and a CSP change (ADR-0009).

## Alternatives considered

- **Merging uploaded files into the current dataset:** rejected because partial uploads would mix sources and make reconciliation and audit hashes ambiguous.
