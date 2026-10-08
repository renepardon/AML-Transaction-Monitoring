import { parseCamt053 } from '@/domain/camt053/parseCamt053';
import {
  dedupeTransactions,
  reconcile,
  type ReconciliationReport,
} from '@/domain/camt053/reconcile';
import { parseClientProfiles } from '@/domain/csv/clientProfileSchema';
import { decodeUtf8 } from '@/domain/decode';
import { DomainError, isDomainError } from '@/domain/errors';
import { sha256Hex } from '@/domain/hash';
import type { ClientProfile, Statement, Transaction } from '@/domain/types';
import { SAMPLE_FILES } from '@/data/sampleData';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 10;
export const ALLOWED_EXTENSIONS = ['.xml', '.csv'] as const;

export interface SourceInput {
  name: string;
  bytes: Uint8Array;
}

export type SourceKind = 'camt053' | 'client_profiles' | 'unknown';

export interface SourceFile {
  name: string;
  size: number;
  sha256: string;
  kind: SourceKind;
  status: 'ok' | 'rejected';
  error?: string;
  records: number;
}

export interface IngestWarning {
  level: 'warning' | 'error';
  source?: string;
  message: string;
}

export interface IngestReport {
  files: number;
  statements: number;
  transactions: number;
  clients: number;
  duplicates: string[];
  unknownIbans: string[];
  warnings: IngestWarning[];
  reconciliation: ReconciliationReport;
  loadedAt: string;
}

export interface Dataset {
  sources: SourceFile[];
  statements: Statement[];
  transactions: Transaction[];
  clients: ClientProfile[];
  report: IngestReport;
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
}

/** Returns a rejection reason or null if the file passes the size and extension allow-list. */
export function checkFile(file: { name: string; size: number }): string | null {
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(extensionOf(file.name))) {
    return `Extension not allowed (only ${ALLOWED_EXTENSIONS.join(', ')})`;
  }
  if (file.size > MAX_FILE_BYTES) return 'File exceeds the 5 MB limit';
  if (file.size === 0) return 'File is empty';
  return null;
}

export function assertFileCount(count: number): void {
  if (count > MAX_FILES) {
    throw new DomainError('FILE_REJECTED', `At most ${MAX_FILES} files can be loaded at once`);
  }
}

export { sha256Hex };

export function sampleSourceInputs(): SourceInput[] {
  const encoder = new TextEncoder();
  return SAMPLE_FILES.map((f) => ({ name: f.name, bytes: encoder.encode(f.text) }));
}

export async function readBrowserFiles(files: File[]): Promise<SourceInput[]> {
  assertFileCount(files.length);
  return Promise.all(
    files.map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })),
  );
}

const sortTx = (a: Transaction, b: Transaction) =>
  a.bookingDate.localeCompare(b.bookingDate) || a.id.localeCompare(b.id);

/** Validates, decodes, parses, de-duplicates, links and reconciles the given files. Never throws for single bad files. */
export async function buildDataset(inputs: SourceInput[], now = new Date()): Promise<Dataset> {
  assertFileCount(inputs.length);
  const sources: SourceFile[] = [];
  const warnings: IngestWarning[] = [];
  const statements: Statement[] = [];
  const parsedTx: Transaction[] = [];
  const clients: ClientProfile[] = [];

  for (const input of inputs) {
    const base = {
      name: input.name,
      size: input.bytes.byteLength,
      sha256: await sha256Hex(input.bytes),
    };
    const kind: SourceKind =
      extensionOf(input.name) === '.xml'
        ? 'camt053'
        : extensionOf(input.name) === '.csv'
          ? 'client_profiles'
          : 'unknown';
    const reject = (error: string) => {
      sources.push({ ...base, kind, status: 'rejected', error, records: 0 });
      warnings.push({ level: 'error', source: input.name, message: error });
    };
    const fileProblem = checkFile(base);
    if (fileProblem) {
      reject(fileProblem);
      continue;
    }
    try {
      const text = decodeUtf8(input.bytes);
      if (kind === 'camt053') {
        const result = parseCamt053(text, input.name);
        statements.push(...result.statements);
        parsedTx.push(...result.transactions);
        sources.push({ ...base, kind, status: 'ok', records: result.transactions.length });
      } else {
        const result = parseClientProfiles(text);
        clients.push(...result.clients);
        for (const e of result.errors) {
          warnings.push({
            level: 'warning',
            source: input.name,
            message: `Line ${e.line}: ${e.message}`,
          });
        }
        sources.push({ ...base, kind, status: 'ok', records: result.clients.length });
      }
    } catch (e) {
      reject(isDomainError(e) ? e.message : 'Unexpected parse failure');
    }
  }

  const { transactions: unique, duplicates } = dedupeTransactions(parsedTx);
  for (const d of duplicates) {
    warnings.push({
      level: 'warning',
      source: d.sourceFile,
      message: `Duplicate entry ${d.acctSvcrRef} on ${d.iban} skipped`,
    });
  }

  const clientByIban = new Map(clients.map((c) => [c.iban, c]));
  const unknownIbans = new Set<string>();
  const transactions = unique
    .map((tx) => {
      const client = clientByIban.get(tx.iban);
      if (!client) unknownIbans.add(tx.iban);
      return { ...tx, clientId: client?.clientId ?? null };
    })
    .sort(sortTx);
  for (const iban of unknownIbans) {
    warnings.push({ level: 'warning', message: `Statement IBAN ${iban} has no client profile` });
  }
  for (const s of statements) {
    const client = clientByIban.get(s.iban);
    if (client && !s.id.startsWith(client.clientId)) {
      warnings.push({
        level: 'warning',
        message: `Statement ${s.id} id prefix does not match client ${client.clientId}`,
      });
    }
  }
  if (clients.length === 0 && statements.length > 0) {
    warnings.push({
      level: 'warning',
      message: 'No client profiles loaded – detection needs client_profiles.csv',
    });
  }

  const reconciliation = reconcile(statements, transactions);
  for (const r of reconciliation.statements.filter((x) => !x.ok)) {
    warnings.push({ level: 'error', message: `Statement ${r.statementId} does not reconcile` });
  }
  for (const c of reconciliation.continuity.filter((x) => !x.ok)) {
    warnings.push({
      level: 'error',
      message: `Closing balance of ${c.fromStatementId} ≠ opening of ${c.toStatementId}`,
    });
  }

  return {
    sources,
    statements,
    transactions,
    clients,
    report: {
      files: inputs.length,
      statements: statements.length,
      transactions: transactions.length,
      clients: clients.length,
      duplicates: duplicates.map((d) => d.id),
      unknownIbans: [...unknownIbans],
      warnings,
      reconciliation,
      loadedAt: now.toISOString(),
    },
  };
}
