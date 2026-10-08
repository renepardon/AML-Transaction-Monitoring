# ADR-0006: Safe data ingestion and money as integer Rappen

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The inputs are ISO 20022 camt.053.001.08 statements and a CSV with CRLF line endings, quoted commas, umlauts and empty fields. The plan lists eleven security and robustness requirements, each needing a unit test.

## Decision

- **File checks:** at most 10 files, 5 MB each, extensions `.xml` and `.csv` only, strict UTF-8 decoding (`TextDecoder` with `fatal: true`), BOM stripped.
- **XML preflight:** any `<!DOCTYPE` or `<!ENTITY` is rejected *before* parsing (XXE and entity expansion).
- **Namespace-aware parsing:** `DOMParser` with `parsererror` detection, and reads only through namespace-aware child lookups. The root namespace must match `camt.053.001.0[2-9]|1[0-9]`.
- **The counterparty is taken by direction:** `Dbtr` for credits, `Cdtr` for debits.
- **Mapping:** raw values are mapped to plain objects and validated with zod (amount regex `^\d{1,13}(\.\d{1,2})?$`, ISO 4217 via `Intl.supportedValuesOf`, ISO 3166-1 alpha-2, ISO dates, IBAN mod-97).
- **Money is integer Rappen** (`number`, safe up to 13 integer digits). Amounts are parsed from strings without `parseFloat` and formatted with `Intl.NumberFormat('de-CH', CHF)`.
- **Linking and checks:** transactions are de-duplicated by IBAN + `AcctSvcrRef` (first occurrence wins) and linked to clients by IBAN, with warnings for unknown IBANs and mismatched `Stmt/Id` prefixes. Every statement is reconciled (OPBD + Σ entries = CLBD, plus month-to-month continuity).
- **Failures:** a single bad file produces a warning and a "rejected" source entry, and the rest of the load continues. Only exceeding the file count aborts the load.
- **Source fingerprints:** the SHA-256 of each source is shown on the Data page and stored in the `data.loaded` audit entry.

## Consequences

- All 193 entries load and all 18 statements reconcile.
- Fractional francs never drift.
- Unit tests cover XXE, wrong namespace, malformed amounts, invalid UTF-8, quoted CSV fields and tampered balances.
