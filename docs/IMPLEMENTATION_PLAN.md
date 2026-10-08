# Coding agent prompt: AML transaction monitoring prototype (Scenario A)

> Copy everything below this line into your coding agent. Put the 4 data files
> (`camt053_BankZuerichsee_2026-07.xml`, `-08.xml`, `-09.xml`, `client_profiles.csv`) next to the prompt.

---

## 0. Role and mission

You are a senior frontend engineer building a presentable, fully working **AML transaction monitoring prototype** for a fictional Swiss bank ("Bank Zürichsee", BIC `ZSEECH22XXX`). It runs entirely in the browser.

The app must:

1. Safely load and parse 3 monthly ISO 20022 **camt.053.001.08** statements (6 accounts, July–September 2026) and a **client profile CSV**.
2. Run **deterministic detection rules** that raise alerts.
3. Run an **AI triage step** ("Claude") that explains each alert in 2–3 sentences and gives a **risk score from 1 to 5**.
4. Group alerts with a score of 3 or more into **cases** (one per client). Show them in a **case list sorted by score**.
5. Let an analyst **close** a case (false positive) or **escalate** it. A reason is always required.
6. Write **every step** to an **append-only audit log** with time, actor, action, and reason.
7. Let "Claude" **draft a suspicious activity report** for escalated cases. This uses a **separate Zustand store**, so the drafting lifecycle is visible.

Hard constraints:

- **No backend, no database, no external API, no network calls at runtime.** Everything is client-side. Sample data is bundled.
- The "Claude" behaviour is implemented by a **local, deterministic provider** behind an interface. A real LLM adapter can be added later without touching the UI (see §7).
- **Zustand is the single source of truth** for all domain and UI state. No domain data in `useState`, Context, or module-level variables.
- **Atomic design**, small components, no god components, each component testable on its own.

---

## 1. Tech stack (keep dependencies minimal)

| Concern | Choice |
|---|---|
| Build | Vite + React 19 + TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`) |
| UI | shadcn/ui (style "new-york", base color "neutral"), Tailwind CSS v4, lucide-react icons |
| Charts | shadcn `chart` component (Recharts). This is the only charting dependency. |
| State | zustand v5 (`persist`, `devtools`, `useShallow`) |
| Validation | zod |
| Tests | vitest, @testing-library/react, @testing-library/user-event, jsdom |
| Lint/format | eslint (typescript-eslint, react-hooks), prettier |

Do **not** add: a router library (navigation state lives in Zustand), axios, date libraries, an XML library, a CSV library, immer, a UI kit other than shadcn. Write the XML and CSV parsing yourself with `DOMParser` and a small tested CSV parser.

shadcn components to install: `button card badge table tabs dialog sheet textarea input label select separator scroll-area tooltip sonner skeleton progress command dropdown-menu avatar alert chart toggle-group`.

---

## 2. Domain knowledge you must apply

### 2.1 camt.053 structure (as found in the files)

Namespace: `urn:iso:std:iso:20022:tech:xsd:camt.053.001.08`. Accept `camt.053.001.0[2-9]|1[0-9]`. Reject anything else.

```
Document/BkToCstmrStmt
  GrpHdr/MsgId, CreDtTm
  Stmt (1 per account per month)
    Id                     e.g. "C1001-202607"
    FrToDt/FrDtTm, ToDtTm
    Acct/Id/IBAN, Acct/Ccy, Acct/Ownr/Nm, Acct/Svcr/FinInstnId/BICFI
    Bal (x2)               Tp/CdOrPrtry/Cd = OPBD | CLBD, Amt@Ccy, CdtDbtInd, Dt/Dt
    Ntry (n)
      Amt@Ccy, CdtDbtInd (CRDT|DBIT), Sts/Cd (BOOK), BookgDt/Dt, ValDt/Dt, AcctSvcrRef
      BkTxCd/Domn/Cd (PMNT) / Fmly/Cd (RCDT|ICDT|CNTR) / Fmly/SubFmlyCd (DMCT|CDPT)
      NtryDtls/TxDtls
        RltdPties/Dbtr/Pty/Nm + PstlAdr/Ctry   (for credits)
        RltdPties/Cdtr/Pty/Nm + PstlAdr/Ctry   (for debits)
        RltdPties/DbtrAcct|CdtrAcct/Id/IBAN    (optional)
        RmtInf/Ustrd                            (free-text purpose)
```

Facts about the bundled files (use them in tests):

- 3 files, 18 `Stmt` (6 accounts × 3 months), **193 entries** in total (60 / 68 / 65 per month).
- Bank transaction codes: `PMNT/RCDT/DMCT` = incoming credit transfer, `PMNT/ICDT/DMCT` = outgoing credit transfer, `PMNT/CNTR/CDPT` = **cash deposit**.
- For every statement, `OPBD + Σ(signed entries) = CLBD`. Each month's `CLBD` equals the next month's `OPBD`. Implement this as an **integrity check** and show it in the UI.
- Statements link to clients via `IBAN` (and the `Stmt/Id` prefix `C100x`).

### 2.2 Client profile CSV

Columns: `client_id, name, client_type, occupation_or_business, age, risk_category, expected_monthly_inflow_chf, expected_monthly_outflow_chf, expected_countries, iban`.

- CRLF line endings, quoted fields that contain commas (e.g. `"CH, DE, IT"`), German umlauts (`erhöht`), and empty `age` for legal entities.
- `risk_category`: `normal | erhöht`. Map to `normal | elevated`, but keep the original label for display.
- `expected_countries`: split on `,`, trim, uppercase, and validate as ISO 3166-1 alpha-2.

### 2.3 Swiss thresholds (put them in `domain/reference/thresholds.ts` with source comments)

| Constant | Value | Basis |
|---|---|---|
| `CASH_IDENTIFICATION_THRESHOLD_CHF` | 15'000 | GwV-FINMA Art. 51 para. 1 lit. b (cash transactions, including **connected** transactions); VSB 20 aligned to CHF 15'000 |
| `MONEY_EXCHANGE_THRESHOLD_CHF` | 5'000 | GwV-FINMA Art. 51 para. 1 lit. a (shown for reference only, not used by rules) |
| `MONEY_TRANSFER_INBOUND_THRESHOLD_CHF` | 1'000 | GwV-FINMA Art. 52 para. 2 (money/value transfer from abroad). Outbound abroad: identify always (para. 1) |
| `STRUCTURING_BAND_RATIO` | 0.80 | Bank policy: "just below" = 80–99.99 % of the threshold, so CHF 12'000–14'999.99 |
| `SMURFING_NOTE` | – | VSB 20: identify if amounts are visibly split to avoid identification ("Smurfing"). Art. 51 para. 3: identify in every case if there are signs of money laundering |

Notes for the UI and the generated report: Art. 52 applies to the money transfer business, not to account-based transfers. Account holders are already identified at onboarding. So on an account, the thresholds matter as **avoidance signals** (structuring), not as onboarding triggers. Payment orders must carry originator and beneficiary data (GwV-FINMA Art. 10, no amount threshold).

### 2.4 Country risk (put it in `domain/reference/countryRisk.ts`)

- `FATF_CALL_FOR_ACTION` (June 2026): `KP, IR, MM`.
- `FATF_INCREASED_MONITORING` (June 2026, 22 jurisdictions): `AO, BO, BA, BG, CM, CI, CD, HT, IQ, KE, KW, LA, LB, MC, NP, PG, SS, SY, VE, VN, VG, YE`.
- `BANK_INTERNAL_ELEVATED` (demo bank policy, **not** FATF): `AE, HK, CY, PA, KY, SC, BS, BZ, MT, LI, EE`. In the UI, label it "Internal risk list – demo policy".
- `countryRiskTier(cc): 'fatf_blacklist' | 'fatf_greylist' | 'internal_elevated' | 'standard'`.
- Write a comment that the lists must be updated after each FATF plenary.

Important: none of the counterparty countries in the data (HK, AE, EE, GB, LI) are on a FATF list. The "high-risk country" signal therefore comes from the **internal list** plus **"country not in the client's expected countries"**. Do not claim in the UI that HK, AE, or EE are FATF-listed.

---

## 3. Detection rules (pure functions, `domain/rules/*`)

Every rule is a pure function `(ctx: RuleContext) => RuleHit[]`. `RuleContext = { client, transactions (all months, sorted), monthlyAggregates, config }`. Each hit carries `ruleId`, `clientId`, `severity: 'low'|'medium'|'high'`, `title`, `summary`, `evidenceTxIds[]`, `metrics: Record<string, number|string>`, and `period`. All thresholds come from a `RuleConfig` object in a Zustand store, so they can be tuned in the UI. **Never hard-code client IDs or names in rules.**

| ID | Name | Logic (defaults) |
|---|---|---|
| `R1_STRUCTURING` | Cash just below identification threshold | Cash deposits (`CNTR/CDPT`, CRDT) with an amount in [12'000, 15'000). Raise a hit if ≥ 3 occur in any rolling 30-day window. Severity is high if ≥ 5 or if the sum is > 3× the threshold. |
| `R2_PASS_THROUGH` | Money in and out within days | A credit ≥ max(CHF 50'000, 2× expected monthly inflow), followed within 10 days by debits that sum to ≥ 80 % of the credit. Report `ratio`, `daysBetween`, and the in/out counterparties and countries. Severity is high if ratio ≥ 95 % or days ≤ 3. |
| `R3_PROFILE_DEVIATION` | Sudden change from the usual profile | Per calendar month: inflow or outflow > 3× expected **and** absolute excess ≥ CHF 10'000. Severity is high if > 6×. |
| `R4_RISK_COUNTRY` | Transfer to or from a risk country | A counterparty country with tier ≠ `standard` → medium (high for FATF lists). Also: a country not in `expected_countries` with amount ≥ CHF 10'000 → medium. Merge both into one hit per transaction. |
| `R5_PURPOSE_MISMATCH` | Purpose or counterparty does not fit the profile | Amount ≥ CHF 10'000 and the remittance or counterparty matches a keyword list (`consulting`, `advisory`, `loan`, `crypto`, `exchange`, `übertrag`, `deposit account`) **or** the debtor name equals the account owner abroad (own-account transfer abroad). Severity medium. |

Also implement `R0_DATA_INTEGRITY` (balance reconciliation failure, duplicate `AcctSvcrRef`). It produces data warnings, not AML alerts.

### Expected detection result (ground truth for the acceptance test)

The pipeline on the bundled files **must** produce this outcome. If it does not, fix the rules, not the test.

| Client | Pattern in the data | Rules expected | Expected triage score | Outcome |
|---|---|---|---|---|
| C1002 Viktor Schaller (used-car dealer, elevated) | Aug: 9 cash deposits CHF 14'200–14'900 (Σ CHF 131'800), inflow 6.4× expected. Sep 2: CHF 120'000 "Übertrag" to own name in **LI** | R1 (high), R3, R4, R5 | 5 | Case → escalate |
| C1003 Nordstern Trading GmbH (household goods, 3 FTE, elevated) | Jul 14: CHF 250'000 from Eastgate Holdings Ltd (**HK**) "Consulting fee" → Jul 16: CHF 246'500 to Meridian Logistics FZE (**AE**). Sep 8/9: CHF 310'000 HK → CHF 306'800 AE "Advisory services" | R2 (high, ×2), R3, R4, R5 | 5 | Case → escalate |
| C1001 Elsa Brunner (retired teacher, 71) | Sep 3: CHF 180'000 "Loan" from Valmont Advisory Ltd (**GB**) → Sep 5 + Sep 11: CHF 95'000 + 80'000 to CryptoNova Exchange OÜ (**EE**). Inflow ~35× expected | R2, R3, R4, R5 | 4–5 (possible money mule or scam victim) | Case → escalate |
| C1006 Sara Huber (insurance project manager) | Aug 28: CHF 18'500 "Bonus 2025/26" from her employer. Sep 4: CHF 38'000 to Garage Meier Toyota AG (CH) "Kaufvertrag … Toyota Corolla". Outflow 5.1× expected | R3 only | 2 (explained by the profile) | Alert in triage queue → **closed as false positive with a reason** |
| C1005 Bäckerei Moser AG | Weekly cash deposits CHF 3'600–5'100 "Tageslosung", card settlements, payroll | none (decoy for naive cash rules) | – | No alert |
| C1004 Lukas Frei | Salary and normal spending | none | – | No alert |

This satisfies the self-check: 3 suspicious accounts and 1 account that looks unusual but is explained by the profile.

---

## 4. AI triage ("Claude", local provider)

`domain/triage/TriageProvider.ts`:

```ts
export interface TriageProvider {
  readonly id: string;            // "mock-claude" | "anthropic"
  triage(input: TriageInput): Promise<TriageResult>;
}
export type TriageResult = {
  alertId: string;
  score: 1 | 2 | 3 | 4 | 5;
  explanation: string;            // exactly 2–3 sentences, plain text
  aggravating: string[];          // short bullet facts
  mitigating: string[];
  recommendedAction: 'open_case' | 'close_suggested';
  model: string; generatedAt: string; latencyMs: number;
};
```

`MockClaudeProvider` (default):

- Deterministic. The same input always gives the same output.
- Simulates latency (400–900 ms, seeded by alert id), so loading states are visible.
- Scoring = `clamp(1..5)` of: base from the maximum rule severity (low 1, medium 2, high 3), +1 if ≥ 3 distinct rules hit the client, +1 if risk_category is elevated **or** the deviation is > 10×, +1 if there is a pass-through to a risk-tier country, −1 or −2 for **mitigating evidence**.
- Mitigating evidence detectors (pure, tested): counterparty equals the known salary payer, remittance contains `Lohn|Bonus|Salär`, domestic counterparty with a contract reference (`Kaufvertrag|Rechnung|Vertrag`), a one-off amount below 6 monthly incomes, all countries in the expected set.
- The explanation is composed from sentence templates filled with real numbers, dates, counterparties, and profile facts. It must read like an analyst wrote it. Example for C1003: "Nordstern Trading received CHF 250'000 from a Hong Kong company as a 'consulting fee' and paid out 98.6 % of it to a UAE logistics firm two days later. Consulting income does not fit a household goods trader with 3 staff, and both countries are outside its expected CH/DE/IT footprint. The same pattern repeated in September with CHF 310'000, which points to a pass-through account."
- Enforce the 2–3 sentence rule with a tested `countSentences()` guard.
- Always label the output in the UI with "AI-generated · simulated Claude · decision stays with the analyst".

Follow-up questions (stage 5, nice to have): `ask(caseId, question)` returns a canned, fact-based answer. Use an intent match on keywords such as "countries", "timeline", "profile", "why score", "similar cases". It is stored in the case's `conversation[]` in Zustand.

---

## 5. Zustand architecture (single source of truth)

One file per store in `src/stores/`. Stores hold state and **thin actions**. Business logic lives in `src/domain` (pure) and is orchestrated by `src/services/pipeline.ts`.

| Store | State | Key actions | Persist |
|---|---|---|---|
| `useDataStore` | `sources[]` (file name, sha256, size, kind, status), `statements`, `transactions` (normalized, by id), `clients` (by id), `ingestReport` (counts, warnings, integrity results), `status: idle|loading|ready|error` | `loadSampleData()`, `loadFiles(File[])`, `reset()` | no (always rebuilt from sources) |
| `useRuleConfigStore` | `RuleConfig` (all thresholds from §3), `enabledRules` | `updateRule()`, `resetDefaults()` | yes |
| `useAlertStore` | `alerts` by id (rule hit + triage status `pending|running|done|error` + `TriageResult`) | `setAlerts()`, `setTriage()`, `dismissAlert(id, reason)` | yes |
| `useCaseStore` | `cases` by id: `{ id, clientId, alertIds, score (= max alert score), status: open|in_review|closed_false_positive|escalated, notes[], conversation[], decision?: {type, reason, actor, at} }` | `openCasesFromAlerts()`, `addNote()`, `closeCase(id, reason)`, `escalateCase(id, reason)`, `reopen(id, reason)` | yes |
| `useReportStore` (**separate, as required**) | `drafts` by caseId: `{ status: idle|queued|generating|draft|in_review|approved|rejected, sections: ReportSection[], streamedText, progress 0–1, version, reviewer? }` | `requestDraft(caseId)`, `appendChunk()`, `completeDraft()`, `editSection()`, `submitForReview()`, `approve(reviewer, reason)`, `reject(reviewer, reason)` | yes |
| `useAuditStore` | `entries[]` append-only: `{ seq, id, at (ISO), actor: {id, name, kind: system|ai|analyst}, action, entity: {type, id}, reason?, before?, after?, prevHash, hash }` | `append()` (the only writer), `verifyChain()` | yes |
| `useSessionStore` | `currentActor` (seed analysts: "A. Keller – AML Analyst", "M. Rossi – Compliance Officer"), `actors[]` | `switchActor()` | yes |
| `useUiStore` | `view` (overview|cases|alerts|clients|reports|audit|data|settings), `selectedCaseId`, `selectedClientId`, filters, sort, open dialog ids, **form drafts** (decision reason text, note text), theme, command palette open | `navigate()`, `select…()`, `setDraft()`, `openDialog()` | partial (theme, view) |

Rules:

- **No `useState` for anything except purely visual, throwaway state** (e.g. hover). Dialog open state and form drafts live in `useUiStore`.
- Never store derived data that can be computed. Use selector hooks in `src/stores/selectors/*.ts` (e.g. `useOpenCasesSortedByScore`, `useClientMonthlySeries(clientId)`, `useCaseTimeline(caseId)`). Use `useShallow` for object/array selections.
- Cross-store writes happen only in `services/*` (via `useXStore.getState()`), never inside one store's action calling another store. This avoids circular imports.
- **Every state-changing action that matters for compliance calls `audit.append()`** through the service layer: data loaded, rule run, alert raised, triage done (actor kind `ai`), case opened, note added, closed, escalated, reopened, report requested, generated, edited, approved, rejected, rule config changed, actor switched.
- `persist` uses `version` + `migrate`, a storage key prefix `aml-poc:`, and a "Reset demo" action that clears all stores and writes a final audit entry before clearing.
- Domain invariants enforced in actions (and tested): the reason is required and trimmed, with ≥ 10 characters. A closed or escalated case cannot be decided again without `reopen`. Escalation automatically calls `requestDraft`. Report approval requires a reviewer different from the escalating analyst (**four-eyes**). Otherwise throw a typed `DomainError` that is shown via a toast.

Audit hash chain (`domain/audit/hashChain.ts`): `hash = SHA-256(prevHash + canonicalJSON(entry without hash))` via `crypto.subtle`. `verifyChain()` returns the first broken `seq` or `ok`. Show a "Chain verified" badge on the audit page.

### Pipeline (`services/pipeline.ts`), mirrors the 8 stages of the exercise

```
ingest → detect → triage (concurrency 2, progress in store) → open cases (score ≥ 3; threshold in config)
→ investigate (UI) → decide (UI) → draft report (useReportStore) → audit (every step)
```

`runPipeline()` is idempotent: same data + same config gives the same alert ids (`hash(ruleId + clientId + evidenceTxIds)`). Re-running after a config change keeps existing decisions for unchanged alerts.

Alerts with a score < 3 stay in an **Alert triage queue**. The analyst can dismiss them with a reason (this is where Sara Huber is closed as a false positive) or promote them to a case.

---

## 6. Safe data loading (`domain/camt053`, `domain/csv`, `services/ingest.ts`)

Sample data is bundled via `import xml from '@/data/samples/camt053_BankZuerichsee_2026-07.xml?raw'` and loaded by `useDataStore.loadSampleData()` on first start. Optional: drag & drop upload on the Data page through the same path.

Security and robustness requirements (each one has a unit test):

1. Size limit of 5 MB per file and 10 files maximum. Allow-list for extensions (`.xml`, `.csv`).
2. Decode with `new TextDecoder('utf-8', { fatal: true })`. Strip the BOM.
3. **Reject any XML that contains `<!DOCTYPE` or `<!ENTITY`** (defence against XXE and entity expansion) before parsing.
4. `new DOMParser().parseFromString(text, 'application/xml')`. Detect `<parsererror>`. Read only through `getElementsByTagNameNS(NS, …)`. Validate the root namespace against the camt.053 regex.
5. Map to plain objects, then validate with **zod** schemas. Amount regex: `^\d{1,13}(\.\d{1,2})?$`. Currency is ISO 4217. Dates are ISO. `CdtDbtInd` is an enum. IBAN is validated with mod-97.
6. **Money as integer Rappen (`bigint` or safe `number` of cents)**. Never use `parseFloat` for amounts. Format with `Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })`.
7. De-duplicate by `IBAN + AcctSvcrRef`. Reconcile the balances (§2.1). Collect warnings instead of crashing. Link statements to clients by IBAN and warn about unknown IBANs.
8. CSV parser: RFC 4180 quotes, CRLF/LF, header validation, zod row schema, numeric coercion with error messages per row.
9. Never use `dangerouslySetInnerHTML`. On CSV/Markdown export, prefix cells starting with `= + - @` with `'` (formula injection).
10. A strict CSP `<meta>` in `index.html`: `default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'`.
11. Store the file name, size, and SHA-256 of each source in `useDataStore.sources` and in the "data loaded" audit entry.

---

## 7. Report drafting (separate store, visible lifecycle)

`domain/reports/ReportDrafter.ts` is an interface. `MockReportDrafter` produces sections and **streams them chunk by chunk** (≈ 30 ms per chunk) into `useReportStore.appendChunk()`, so the UI shows the draft being written live with a progress bar and status chips: `queued → generating → draft → in review → approved`.

Use a structure close to an MROS suspicious activity report (Art. 9 GwG). MROS receives reports through goAML.

1. Reporting institution (Bank Zürichsee, BIC, reporting officer = current actor)
2. Subject (client data from the profile, account IBAN)
3. Summary of the suspicion (2–4 sentences)
4. Transactions concerned (table: date, amount, direction, counterparty, country, purpose, evidence ref `AcctSvcrRef`)
5. Comparison with the client profile (expected vs actual, per month)
6. Red flags matched (rule ids + plain-language description, thresholds cited)
7. Clarifications done and analyst reasoning (from case notes and decision reason)
8. Measures taken / recommended (e.g. block, request documents, MROS report under Art. 9 GwG, or Art. 305ter para. 2 StGB right to report)
9. Attachments list (statement ids, audit hash range)

Sections are editable (textarea per section, draft in `useUiStore`). Every edit bumps `version` and is audited. Export: "Copy as Markdown" and "Print / Save as PDF" (`window.print()` with a print stylesheet). No PDF library. Each draft carries the banner "Draft for human review – not submitted".

Optional `AnthropicTriageProvider` / `AnthropicReportDrafter` files may exist **behind a feature flag that is off by default** and must not be imported in the default bundle path. Do not ship any API key.

---

## 8. UI and UX ("as simple as Apple would design it")

Design language:

- Calm, generous whitespace, one accent color (system blue `oklch(0.6 0.2 255)`), neutral grays. Risk colors are muted and used sparingly: 1–2 gray/green, 3 amber, 4–5 red.
- Font: `-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif`. Tabular numbers for amounts (`font-variant-numeric: tabular-nums`).
- `rounded-2xl` cards, hairline borders (`border-black/5`, dark `border-white/10`), no heavy shadows. Translucent sidebar (`backdrop-blur`). Light and dark mode.
- Motion: 150–200 ms ease-out transitions, a skeleton while triage runs, and a subtle streaming caret in the report.
- Keyboard: `⌘K` command palette (navigate, open case by client name), `J/K` to move through the case list, `E` to escalate, `C` to close (both open the reason dialog).
- Accessibility: all interactive elements are focusable, with labels. Contrast meets AA. The score is never conveyed by color alone (number + label).

Screens (sidebar navigation, state in `useUiStore.view`):

1. **Overview**: 4 KPI cards (accounts monitored, transactions ingested, open cases, escalated). An **8-stage pipeline strip** with live status per stage. "Top cases" (3 highest scores). A data integrity badge.
2. **Cases** (the demo screen): split view. Left: case list sorted by score descending, then date (score ring, client name, rule chips, age, status). Right: case detail with:
   - header (client, type, risk category, IBAN masked as `CH32 •••• 0001`, status, score ring)
   - **AI explanation card** (2–3 sentences, aggravating/mitigating facts, model label)
   - triggered rules with evidence
   - **flow chart**: monthly inflow/outflow vs expected (bar + dashed reference line)
   - transaction timeline with evidence rows highlighted, and in→out links for pass-through
   - notes and follow-up Q&A
   - sticky **decision bar**: `Close as false positive` / `Escalate`. Both open a dialog with a required reason, a min-length counter, and the current actor shown.
3. **Alert triage queue**: all alerts, including score < 3, with filter chips by rule and score. Dismiss or promote with a reason.
4. **Clients**: 6 client cards with profile vs actual sparkline. A detail sheet with all transactions.
5. **Reports**: drafts by status. A detail view with streaming, editable sections, submit for review, and approve/reject (four-eyes enforced; the actor switcher is in the top bar).
6. **Audit log**: a virtualized-looking table (time, actor with kind icon, action, entity, reason), filters, hash-chain verification badge, and CSV export.
7. **Data**: loaded sources (name, size, SHA-256 short), ingest report, balance reconciliation per statement, warnings, upload drop zone, and "Reset demo".
8. **Settings**: rule thresholds (sliders/inputs bound to `useRuleConfigStore`), case-open score threshold, "Re-run detection".

Use empty states, loading skeletons, and error states for every list.

---

## 9. Atomic design and file layout

```
src/
  app/              App.tsx, main.tsx, ThemeProvider (reads useUiStore), ErrorBoundary
  domain/           PURE TypeScript, no React, no stores
    types.ts  money.ts  dates.ts  iban.ts  ids.ts  errors.ts
    camt053/ parseCamt053.ts schema.ts bankTxCode.ts reconcile.ts
    csv/ parseCsv.ts clientProfileSchema.ts
    reference/ thresholds.ts countryRisk.ts keywords.ts
    rules/ structuring.ts passThrough.ts profileDeviation.ts riskCountry.ts purposeMismatch.ts dataIntegrity.ts runRules.ts aggregates.ts
    triage/ TriageProvider.ts mockClaudeProvider.ts scoring.ts mitigation.ts explanationTemplates.ts sentences.ts
    cases/ groupAlerts.ts
    reports/ ReportDrafter.ts mockReportDrafter.ts mrosTemplate.ts
    audit/ hashChain.ts canonicalJson.ts
  services/         pipeline.ts ingest.ts decisions.ts reporting.ts audit.ts (the only cross-store writers)
  stores/           useDataStore.ts … useUiStore.ts, selectors/*.ts, persistConfig.ts
  data/samples/     3 xml + 1 csv (copied unchanged)
  components/
    ui/             shadcn generated (do not edit by hand)
    atoms/          Amount, RiskScoreBadge, ScoreRing, CountryTag, RuleChip, StatusPill, MaskedIban, ActorAvatar, Kbd, AiLabel, Timestamp
    molecules/      KpiCard, AlertRow, CaseListItem, TransactionRow, ReasonField, FactList, PipelineStep, IntegrityBadge, SourceFileRow, ChatMessage, ReportSectionEditor
    organisms/      CaseList, CaseHeader, AiExplanationCard, RuleEvidenceList, FlowVsProfileChart, TransactionTimeline, DecisionBar, DecisionDialog, NotesPanel, FollowUpChat, AlertQueueTable, ClientGrid, ReportDraftView, ReportStatusTracker, AuditLogTable, IngestPanel, RuleSettingsForm, PipelineStrip, CommandPalette, AppSidebar, TopBar
    templates/      AppShell, SplitViewTemplate, PageTemplate
  pages/            OverviewPage, CasesPage, AlertsPage, ClientsPage, ReportsPage, AuditPage, DataPage, SettingsPage
  lib/              cn.ts, format.ts, keyboard.ts
  test/             setup.ts, fixtures/ (tiny hand-made camt + csv), builders.ts
```

Component rules:

- One component per file, ≤ ~120 lines, named export, typed props interface `XProps`.
- **Atoms and molecules are pure** (props in, callbacks out). They never import stores. **Organisms** may read selectors and call service functions. **Pages** only compose templates and organisms.
- No business logic in components. Formatting goes through `lib/format.ts`.
- Each atom, molecule, and organism has a colocated `*.test.tsx`.

---

## 10. Tests (vitest), all must pass with `npm test`

- `parseCamt053`: valid file → 193 entries in total over 3 files. Rejects DOCTYPE/ENTITY, the wrong namespace, a malformed amount, and invalid UTF-8. Signs and cents are correct.
- `reconcile`: all 18 statements reconcile. A tampered fixture fails.
- `parseCsv`: quoted commas, CRLF, umlauts, empty age, bad numeric → row error.
- Each rule: positive and negative fixture, plus a threshold edge case (14'999.99 hits, 15'000.00 does not).
- `scoring` / `mitigation`: Sara Huber–like fixture scores ≤ 2. Pass-through to a risk country scores ≥ 4.
- `sentences`: every explanation has 2–3 sentences.
- **Acceptance test** `pipeline.acceptance.test.ts` on the real bundled files asserts the table in §3. Cases = {C1001, C1002, C1003}, sorted by score. C1006 is in the triage queue with score ≤ 2. C1004 and C1005 have no alert.
- Stores: a decision without a reason throws. Escalate → report draft queued → audit entries exist in order. Four-eyes is enforced. `verifyChain` detects tampering. Persist migrate works.
- Components: `DecisionDialog` disables submit until the reason is valid. `CaseList` renders in score order. `AiExplanationCard` shows the AI label.

Also add `npm run typecheck`, `npm run lint`, `npm run build`. All of them must be green.

---

## 11. Delivery plan (work in this order, one commit per step)

1. Scaffold Vite + TS strict + Tailwind v4 + shadcn + vitest. Copy the data. Add CSP.
2. `domain/money`, `iban`, `csv`, `camt053` + tests.
3. `useDataStore` + `services/ingest` + Data page (ingest report, reconciliation).
4. Reference data + rules R0–R5 + tests + the acceptance test (the detection part).
5. `useAuditStore` + hash chain + audit service + Audit page.
6. Triage provider + `useAlertStore` + Alert queue page with skeletons.
7. Case grouping + `useCaseStore` + Cases split view + decision dialog.
8. `useReportStore` + streaming drafter + Reports page + four-eyes.
9. Overview (KPIs, pipeline strip), Clients, Settings, command palette, keyboard shortcuts, dark mode.
10. Polish: empty and error states, a11y pass, print stylesheet, README with the demo script.

## 12. Definition of done

- `npm i && npm run dev` opens the app with the data already loaded. No network requests are made (check in the DevTools Network tab).
- The two-minute demo works end to end: Overview → Cases → open the top case → read the AI explanation → Escalate with a reason → the report streams in Reports → approve it as a second analyst → the Audit log shows every step with time, actor, and reason, and the chain is verified. Then: Alert queue → Sara Huber → close as false positive with a reason.
- All tests, typecheck, lint, and build pass. No component file is > 150 lines. No store imports another store.
- The README explains the rules, thresholds (with legal references), country lists (with date), the simulated-AI limitation, and how to plug in a real model.
