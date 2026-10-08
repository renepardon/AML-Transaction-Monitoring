# ADR-0012: Append-only, hash-chained audit log

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

Every step must record who or what did it (system, AI or analyst), when, and why. Tampering should be detectable even though storage is local.

## Decision

- **`useAuditStore.append()` is the only writer.** Services call it through `services/audit.ts`, with the current analyst as the default actor.
- **Hashing:** `hash = SHA-256(prevHash + canonicalJSON(entry without hash))` via `crypto.subtle`. The canonical JSON has sorted keys and drops `undefined` values.
- **Ordering:** hashing is asynchronous, so appends are serialised through an internal promise queue. This keeps `seq` and `prevHash` in call order even for concurrent appends.
- **Verification:** `verifyChain()` reports the first broken `seq`. The Audit page re-verifies on every change and shows a "Chain verified" badge. The log can be exported as formula-injection-safe CSV.
- **What is audited:** data loading (with source SHA-256s), rule runs, every raised alert, triage (actor `ai`), case changes, notes, questions, decisions, report events, config changes, actor switches and demo resets.
- **"Reset demo"** writes a final `demo.reset` entry, then clears all stores and starts a **new chain anchored on the last hash** (`anchorHash`). This satisfies "write a final entry before clearing" without leaving a broken chain.

## Consequences

- Tampering with or removing an entry is detected (tests cover both).
- The log lives in `localStorage`, so it is tamper-evident, not tamper-proof.
