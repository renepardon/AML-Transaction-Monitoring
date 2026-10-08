import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Actor } from '@/domain/actors';
import type { CaseGroup } from '@/domain/cases/groupAlerts';
import { isDecided, type CaseRecord, type ChatMessage } from '@/domain/cases/types';
import { DomainError } from '@/domain/errors';
import { validateReason } from '@/domain/reason';
import { devtoolsOptions, persistOptions } from './persistConfig';

interface CaseState {
  cases: Record<string, CaseRecord>;
  openCasesFromAlerts: (
    groups: CaseGroup[],
    now?: string,
  ) => { opened: string[]; updated: string[] };
  addNote: (caseId: string, text: string, actor: Actor, now?: string) => CaseRecord;
  addConversation: (caseId: string, messages: ChatMessage[]) => CaseRecord;
  closeCase: (caseId: string, reason: string, actor: Actor, now?: string) => CaseRecord;
  escalateCase: (caseId: string, reason: string, actor: Actor, now?: string) => CaseRecord;
  reopen: (caseId: string, reason: string, actor: Actor, now?: string) => CaseRecord;
  resetCases: () => void;
}

const nowIso = () => new Date().toISOString();

/** v0 → v1: cases gained `history` (reopened decisions) and `conversation`. */
export function migrateCases(persisted: unknown, version: number): Pick<CaseState, 'cases'> {
  const state = (persisted ?? { cases: {} }) as { cases: Record<string, Partial<CaseRecord>> };
  if (version >= 1) return state as Pick<CaseState, 'cases'>;
  const cases = Object.fromEntries(
    Object.entries(state.cases ?? {}).map(([id, c]) => [
      id,
      { ...c, history: c.history ?? [], conversation: c.conversation ?? [] } as CaseRecord,
    ]),
  );
  return { cases };
}

export const useCaseStore = create<CaseState>()(
  devtools(
    persist(
      (set, get) => {
        const require = (id: string) => {
          const c = get().cases[id];
          if (!c) throw new DomainError('NOT_FOUND', `Case ${id} not found`);
          return c;
        };
        const save = (c: CaseRecord) => {
          set((s) => ({ cases: { ...s.cases, [c.id]: c } }));
          return c;
        };
        const decide = (
          id: string,
          type: 'closed_false_positive' | 'escalated',
          reason: string,
          actor: Actor,
          at: string,
        ) => {
          const c = require(id);
          if (isDecided(c.status))
            throw new DomainError(
              'ALREADY_DECIDED',
              'This case has already been decided. Reopen it first.',
            );
          return save({
            ...c,
            status: type,
            decision: { type, reason: validateReason(reason), actor, at },
            updatedAt: at,
          });
        };
        return {
          cases: {},
          openCasesFromAlerts: (groups, now = nowIso()) => {
            const opened: string[] = [];
            const updated: string[] = [];
            const next = { ...get().cases };
            for (const g of groups) {
              const existing = next[g.caseId];
              if (!existing) {
                next[g.caseId] = {
                  id: g.caseId,
                  clientId: g.clientId,
                  alertIds: g.alertIds,
                  score: g.score,
                  status: 'open',
                  notes: [],
                  conversation: [],
                  history: [],
                  openedAt: now,
                  updatedAt: now,
                };
                opened.push(g.caseId);
                continue;
              }
              if (isDecided(existing.status)) continue;
              const alertIds = [...new Set([...existing.alertIds, ...g.alertIds])].sort();
              const score = Math.max(existing.score, g.score);
              if (alertIds.length !== existing.alertIds.length || score !== existing.score) {
                next[g.caseId] = { ...existing, alertIds, score, updatedAt: now };
                updated.push(g.caseId);
              }
            }
            set({ cases: next });
            return { opened, updated };
          },
          addNote: (id, text, actor, now = nowIso()) => {
            const c = require(id);
            const trimmed = text.trim();
            if (!trimmed) throw new DomainError('VALIDATION_ERROR', 'A note cannot be empty');
            const note = { id: `${id}-N${c.notes.length + 1}`, text: trimmed, actor, at: now };
            return save({
              ...c,
              notes: [...c.notes, note],
              status: c.status === 'open' ? 'in_review' : c.status,
              updatedAt: now,
            });
          },
          addConversation: (id, messages) => {
            const c = require(id);
            const at = messages[messages.length - 1]?.at ?? nowIso();
            return save({
              ...c,
              conversation: [...c.conversation, ...messages],
              status: c.status === 'open' ? 'in_review' : c.status,
              updatedAt: at,
            });
          },
          closeCase: (id, reason, actor, now = nowIso()) =>
            decide(id, 'closed_false_positive', reason, actor, now),
          escalateCase: (id, reason, actor, now = nowIso()) =>
            decide(id, 'escalated', reason, actor, now),
          reopen: (id, reason, actor, now = nowIso()) => {
            const c = require(id);
            if (!c.decision || !isDecided(c.status))
              throw new DomainError('INVALID_STATE', 'Only a decided case can be reopened');
            const entry = {
              ...c.decision,
              reopenedBy: actor,
              reopenReason: validateReason(reason),
              reopenedAt: now,
            };
            return save({
              ...c,
              status: 'in_review',
              decision: undefined,
              history: [...c.history, entry],
              updatedAt: now,
            });
          },
          resetCases: () => set({ cases: {} }),
        };
      },
      persistOptions<CaseState, Pick<CaseState, 'cases'>>('cases', 1, {
        partialize: (s) => ({ cases: s.cases }),
        migrate: (persisted, version) => migrateCases(persisted, version),
      }),
    ),
    devtoolsOptions('cases'),
  ),
);
