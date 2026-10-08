import { useMemo } from 'react';
import type { AuditEntry } from '@/domain/audit/hashChain';
import { toCsv } from '@/domain/csv/parseCsv';
import { useAuditStore } from '@/stores/useAuditStore';
import { useUiStore } from '@/stores/useUiStore';

export function matchesAuditFilter(entry: AuditEntry, filter: string): boolean {
  const q = filter.trim().toLowerCase();
  if (!q) return true;
  return [entry.action, entry.actor.name, entry.entity.type, entry.entity.id, entry.reason ?? '']
    .join(' ')
    .toLowerCase()
    .includes(q);
}

/** Newest first, filtered by the audit search box. */
export function useFilteredAuditEntries(): AuditEntry[] {
  const entries = useAuditStore((s) => s.entries);
  const filter = useUiStore((s) => s.auditFilter);
  return useMemo(
    () => entries.filter((e) => matchesAuditFilter(e, filter)).reverse(),
    [entries, filter],
  );
}

export function auditToCsv(entries: AuditEntry[]): string {
  return toCsv([
    [
      'seq',
      'at',
      'actor',
      'actor_kind',
      'action',
      'entity_type',
      'entity_id',
      'reason',
      'prev_hash',
      'hash',
    ],
    ...entries.map((e) => [
      String(e.seq),
      e.at,
      e.actor.name,
      e.actor.kind,
      e.action,
      e.entity.type,
      e.entity.id,
      e.reason ?? '',
      e.prevHash,
      e.hash,
    ]),
  ]);
}
