# ADR-0017: Bundle splitting and size budget

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The first production build was a single JS chunk of about 1.25 MB. Part of it is the bundled sample data, which is required by ADR-0002.

## Decision

- **Vendor chunks** are split with `manualChunks`: `react`, `charts` (recharts), `ui` (radix-ui, cmdk, sonner, lucide-react) and `state` (zustand, zod).
- **The app chunk stays at about 633 kB** because it contains about 215 KB of camt.053 XML. `chunkSizeWarningLimit` is set to 800 kB, with a comment explaining why.
- **No dynamic route splitting:** there is no router, and the demo loads everything up front.

## Consequences

- Vendor code is cached separately from app changes.
- If the sample data grows or real data is used, it should be loaded separately rather than bundled.
