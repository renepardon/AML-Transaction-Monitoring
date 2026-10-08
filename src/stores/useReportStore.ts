import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Actor } from '@/domain/actors';
import { DomainError } from '@/domain/errors';
import { validateReason } from '@/domain/reason';
import type { ReportChunk, ReportSection } from '@/domain/reports/ReportDrafter';
import { devtoolsOptions, persistOptions } from './persistConfig';

export type ReportStatus =
  'idle' | 'queued' | 'generating' | 'draft' | 'in_review' | 'approved' | 'rejected';

export interface ReportReview {
  actor: Actor;
  decision: 'approved' | 'rejected';
  reason: string;
  at: string;
}

export interface ReportDraft {
  caseId: string;
  status: ReportStatus;
  sections: ReportSection[];
  streamedText: string;
  progress: number;
  version: number;
  /** The escalating analyst; approval must come from someone else (four-eyes). */
  requestedBy: Actor;
  requestedAt: string;
  submittedBy?: Actor;
  reviewer?: ReportReview;
  updatedAt: string;
}

interface ReportState {
  drafts: Record<string, ReportDraft>;
  requestDraft: (caseId: string, requestedBy: Actor, now?: string) => ReportDraft;
  startGenerating: (caseId: string, skeleton: { id: string; title: string }[]) => void;
  appendChunk: (caseId: string, chunk: ReportChunk, progress: number) => void;
  completeDraft: (caseId: string, sections: ReportSection[]) => void;
  editSection: (
    caseId: string,
    sectionId: string,
    body: string,
  ) => { before: string; after: string };
  submitForReview: (caseId: string, actor: Actor) => void;
  approve: (caseId: string, reviewer: Actor, reason: string) => void;
  reject: (caseId: string, reviewer: Actor, reason: string) => void;
  resetReports: () => void;
}

const nowIso = () => new Date().toISOString();

export const useReportStore = create<ReportState>()(
  devtools(
    persist(
      (set, get) => {
        const require = (caseId: string) => {
          const d = get().drafts[caseId];
          if (!d) throw new DomainError('NOT_FOUND', `No report draft for ${caseId}`);
          return d;
        };
        const patch = (caseId: string, p: Partial<ReportDraft>) =>
          set((s) => ({
            drafts: { ...s.drafts, [caseId]: { ...require(caseId), ...p, updatedAt: nowIso() } },
          }));
        const review = (
          caseId: string,
          reviewer: Actor,
          reason: string,
          decision: 'approved' | 'rejected',
        ) => {
          const d = require(caseId);
          if (d.status !== 'in_review')
            throw new DomainError(
              'INVALID_STATE',
              'Only a report in review can be approved or rejected',
            );
          if (reviewer.id === d.requestedBy.id) {
            throw new DomainError(
              'FOUR_EYES',
              `Four-eyes principle: ${reviewer.name} escalated this case and cannot review the report. Switch to another analyst.`,
            );
          }
          patch(caseId, {
            status: decision,
            reviewer: { actor: reviewer, decision, reason: validateReason(reason), at: nowIso() },
          });
        };
        return {
          drafts: {},
          requestDraft: (caseId, requestedBy, now = nowIso()) => {
            const existing = get().drafts[caseId];
            if (existing && !['rejected', 'idle'].includes(existing.status)) {
              throw new DomainError('INVALID_STATE', 'A report draft already exists for this case');
            }
            const draft: ReportDraft = {
              caseId,
              status: 'queued',
              sections: [],
              streamedText: '',
              progress: 0,
              version: existing?.version ?? 0,
              requestedBy,
              requestedAt: now,
              updatedAt: now,
            };
            set((s) => ({ drafts: { ...s.drafts, [caseId]: draft } }));
            return draft;
          },
          startGenerating: (caseId, skeleton) =>
            patch(caseId, {
              status: 'generating',
              sections: skeleton.map((s) => ({ ...s, body: '' })),
              streamedText: '',
              progress: 0,
            }),
          appendChunk: (caseId, chunk, progress) => {
            const d = require(caseId);
            patch(caseId, {
              sections: d.sections.map((s) =>
                s.id === chunk.sectionId ? { ...s, body: s.body + chunk.text } : s,
              ),
              streamedText: d.streamedText + chunk.text,
              progress: Math.min(1, progress),
            });
          },
          completeDraft: (caseId, sections) =>
            patch(caseId, {
              status: 'draft',
              sections,
              progress: 1,
              version: require(caseId).version + 1,
            }),
          editSection: (caseId, sectionId, body) => {
            const d = require(caseId);
            if (d.status !== 'draft')
              throw new DomainError('INVALID_STATE', 'Only a draft can be edited');
            const section = d.sections.find((s) => s.id === sectionId);
            if (!section) throw new DomainError('NOT_FOUND', `Unknown section ${sectionId}`);
            patch(caseId, {
              sections: d.sections.map((s) => (s.id === sectionId ? { ...s, body } : s)),
              version: d.version + 1,
            });
            return { before: section.body, after: body };
          },
          submitForReview: (caseId, actor) => {
            if (require(caseId).status !== 'draft')
              throw new DomainError('INVALID_STATE', 'Only a draft can be submitted for review');
            patch(caseId, { status: 'in_review', submittedBy: actor });
          },
          approve: (caseId, reviewer, reason) => review(caseId, reviewer, reason, 'approved'),
          reject: (caseId, reviewer, reason) => review(caseId, reviewer, reason, 'rejected'),
          resetReports: () => set({ drafts: {} }),
        };
      },
      persistOptions<ReportState, Pick<ReportState, 'drafts'>>('reports', 1, {
        partialize: (s) => ({ drafts: s.drafts }),
      }),
    ),
    devtoolsOptions('reports'),
  ),
);
