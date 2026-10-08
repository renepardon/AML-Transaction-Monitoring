import type { Actor } from '@/domain/actors';
import type { AuditAction, AuditEntity, AuditEntry } from '@/domain/audit/hashChain';
import { useAuditStore } from '@/stores/useAuditStore';
import { useSessionStore } from '@/stores/useSessionStore';

export interface AuditOptions {
  actor?: Actor;
  reason?: string;
  before?: unknown;
  after?: unknown;
}

export function currentActor(): Actor {
  return useSessionStore.getState().currentActor;
}

/** The single entry point for writing to the audit log. Defaults to the current analyst. */
export function audit(
  action: AuditAction,
  entity: AuditEntity,
  options: AuditOptions = {},
): Promise<AuditEntry> {
  return useAuditStore.getState().append({
    action,
    entity,
    actor: options.actor ?? currentActor(),
    reason: options.reason,
    before: options.before,
    after: options.after,
  });
}
