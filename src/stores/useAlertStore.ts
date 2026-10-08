import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Actor } from '@/domain/actors';
import { DomainError } from '@/domain/errors';
import { validateReason } from '@/domain/reason';
import type { RuleHit } from '@/domain/rules/types';
import type { TriageResult } from '@/domain/triage/TriageProvider';
import { devtoolsOptions, persistOptions } from './persistConfig';

export type TriageStatus = 'pending' | 'running' | 'done' | 'error';

export interface AlertRecord {
  id: string;
  hit: RuleHit;
  raisedAt: string;
  triageStatus: TriageStatus;
  triage?: TriageResult;
  error?: string;
  dismissal?: { reason: string; actor: Actor; at: string };
  promotedAt?: string;
}

interface AlertState {
  alerts: Record<string, AlertRecord>;
  /**
   * Replaces the alert set with the latest rule hits. Existing alerts keep their triage and decisions.
   * Alerts that are no longer raised are dropped unless dismissed or listed in `keepIds`.
   */
  setAlerts: (
    incoming: { id: string; hit: RuleHit }[],
    keepIds?: string[],
    now?: string,
  ) => { added: string[]; removed: string[] };
  setTriage: (
    id: string,
    patch: { status: TriageStatus; result?: TriageResult; error?: string },
  ) => void;
  dismissAlert: (id: string, reason: string, actor: Actor, now?: string) => AlertRecord;
  markPromoted: (id: string, now?: string) => void;
  resetAlerts: () => void;
}

export const useAlertStore = create<AlertState>()(
  devtools(
    persist(
      (set, get) => ({
        alerts: {},
        setAlerts: (incoming, keepIds = [], now = new Date().toISOString()) => {
          const current = get().alerts;
          const next: Record<string, AlertRecord> = {};
          const added: string[] = [];
          for (const { id, hit } of incoming) {
            const existing = current[id];
            if (existing) {
              // An interrupted triage (e.g. page reload) is retried.
              next[id] = {
                ...existing,
                hit,
                triageStatus:
                  existing.triageStatus === 'running' ? 'pending' : existing.triageStatus,
              };
            } else {
              next[id] = { id, hit, raisedAt: now, triageStatus: 'pending' };
              added.push(id);
            }
          }
          const keep = new Set(keepIds);
          const removed: string[] = [];
          for (const [id, record] of Object.entries(current)) {
            if (next[id]) continue;
            if (record.dismissal || keep.has(id)) next[id] = record;
            else removed.push(id);
          }
          set({ alerts: next });
          return { added, removed };
        },
        setTriage: (id, { status, result, error }) =>
          set((s) => {
            const alert = s.alerts[id];
            if (!alert) return s;
            return {
              alerts: {
                ...s.alerts,
                [id]: { ...alert, triageStatus: status, triage: result ?? alert.triage, error },
              },
            };
          }),
        dismissAlert: (id, reason, actor, now = new Date().toISOString()) => {
          const alert = get().alerts[id];
          if (!alert) throw new DomainError('NOT_FOUND', `Alert ${id} not found`);
          if (alert.dismissal)
            throw new DomainError('ALREADY_DECIDED', 'This alert has already been dismissed');
          if (alert.promotedAt)
            throw new DomainError('ALREADY_DECIDED', 'This alert has been promoted to a case');
          const updated = {
            ...alert,
            dismissal: { reason: validateReason(reason), actor, at: now },
          };
          set((s) => ({ alerts: { ...s.alerts, [id]: updated } }));
          return updated;
        },
        markPromoted: (id, now = new Date().toISOString()) =>
          set((s) => {
            const alert = s.alerts[id];
            if (!alert) return s;
            return { alerts: { ...s.alerts, [id]: { ...alert, promotedAt: now } } };
          }),
        resetAlerts: () => set({ alerts: {} }),
      }),
      persistOptions<AlertState, Pick<AlertState, 'alerts'>>('alerts', 1, {
        partialize: (s) => ({ alerts: s.alerts }),
      }),
    ),
    devtoolsOptions('alerts'),
  ),
);
