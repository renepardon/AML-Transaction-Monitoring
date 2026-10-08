import type { Actor } from '../actors';
import { sha256Hex } from '../hash';
import { canonicalJson } from './canonicalJson';

export const GENESIS_HASH = '0'.repeat(64);

export type AuditAction =
  | 'data.loaded'
  | 'data.load_failed'
  | 'rules.run'
  | 'alert.raised'
  | 'triage.completed'
  | 'triage.failed'
  | 'case.opened'
  | 'case.updated'
  | 'case.note_added'
  | 'case.question_asked'
  | 'case.closed'
  | 'case.escalated'
  | 'case.reopened'
  | 'alert.dismissed'
  | 'alert.promoted'
  | 'report.requested'
  | 'report.generated'
  | 'report.edited'
  | 'report.submitted'
  | 'report.approved'
  | 'report.rejected'
  | 'config.changed'
  | 'actor.switched'
  | 'demo.reset';

export interface AuditEntity {
  type: 'dataset' | 'rules' | 'alert' | 'case' | 'report' | 'config' | 'session' | 'demo';
  id: string;
}

export interface AuditEntry {
  seq: number;
  id: string;
  at: string;
  actor: Actor;
  action: AuditAction;
  entity: AuditEntity;
  reason?: string;
  before?: unknown;
  after?: unknown;
  prevHash: string;
  hash: string;
}

export type AuditEntryDraft = Omit<AuditEntry, 'hash'>;

/** hash = SHA-256(prevHash + canonicalJSON(entry without hash)) */
export function hashEntry(entry: AuditEntryDraft): Promise<string> {
  return sha256Hex(entry.prevHash + canonicalJson(entry));
}

export type ChainVerification =
  { ok: true; count: number } | { ok: false; brokenSeq: number; count: number };

/**
 * Recomputes every hash and checks the links. The first entry may point to an anchor
 * (the last hash of a previous chain after "Reset demo") instead of the genesis hash.
 */
export async function verifyChain(
  entries: AuditEntry[],
  anchorHash = GENESIS_HASH,
): Promise<ChainVerification> {
  let prev = anchorHash;
  for (const entry of entries) {
    const { hash, ...draft } = entry;
    if (entry.prevHash !== prev || (await hashEntry(draft)) !== hash) {
      return { ok: false, brokenSeq: entry.seq, count: entries.length };
    }
    prev = hash;
  }
  return { ok: true, count: entries.length };
}
