import { AI_ACTOR } from '@/domain/actors';
import { DomainError } from '@/domain/errors';
import { monthlyAggregates } from '@/domain/rules/aggregates';
import { MockReportDrafter } from '@/domain/reports/mockReportDrafter';
import { buildMrosSections, reportToMarkdown } from '@/domain/reports/mrosTemplate';
import { DRAFT_BANNER, type ReportDrafter, type ReportInput } from '@/domain/reports/ReportDrafter';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuditStore } from '@/stores/useAuditStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';
import { useReportStore } from '@/stores/useReportStore';
import { useRuleConfigStore } from '@/stores/useRuleConfigStore';
import { audit, currentActor } from './audit';

let drafter: ReportDrafter = new MockReportDrafter();
const inFlight = new Map<string, Promise<void>>();

export function setReportDrafter(next: ReportDrafter): void {
  drafter = next;
}

/** Resolves when all running report generations are finished (tests, reset). */
export async function waitForDrafts(): Promise<void> {
  await Promise.all([...inFlight.values()]);
}

function buildReportInput(caseId: string): ReportInput {
  const caseRecord = useCaseStore.getState().cases[caseId];
  if (!caseRecord) throw new DomainError('NOT_FOUND', `Case ${caseId} not found`);
  const { clients, transactions, statements } = useDataStore.getState();
  const client = clients[caseRecord.clientId];
  if (!client) throw new DomainError('NOT_FOUND', `Client ${caseRecord.clientId} not loaded`);
  const alertMap = useAlertStore.getState().alerts;
  const alerts = caseRecord.alertIds
    .map((id) => alertMap[id])
    .filter((a) => !!a)
    .map((a) => ({ id: a!.id, hit: a!.hit, triage: a!.triage }));
  const clientTx = Object.values(transactions)
    .filter((t) => t.clientId === client.clientId)
    .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
  const related = new Set([caseId, ...caseRecord.alertIds]);
  const entries = useAuditStore.getState().entries.filter((e) => related.has(e.entity.id));
  const first = entries[0];
  const last = entries[entries.length - 1];
  return {
    caseRecord,
    client,
    alerts,
    transactions: clientTx,
    monthly: monthlyAggregates(client.clientId, clientTx),
    statements: Object.values(statements).filter((s) => s.iban === client.iban),
    config: useRuleConfigStore.getState().config,
    reportingOfficer: useReportStore.getState().drafts[caseId]?.requestedBy ?? currentActor(),
    auditRange:
      first && last
        ? { fromSeq: first.seq, toSeq: last.seq, fromHash: first.hash, toHash: last.hash }
        : null,
    generatedAt: new Date().toISOString(),
  };
}

async function generate(caseId: string): Promise<void> {
  const input = buildReportInput(caseId);
  const store = useReportStore.getState();
  const total = buildMrosSections(input).reduce((n, s) => n + s.body.length, 0) || 1;
  store.startGenerating(caseId, drafter.sections(input));
  const stillGenerating = () => useReportStore.getState().drafts[caseId]?.status === 'generating';
  let written = 0;
  for await (const chunk of drafter.draft(input)) {
    // The draft can disappear mid-stream (e.g. "Reset demo"); stop quietly.
    if (!stillGenerating()) return;
    written += chunk.text.length;
    useReportStore.getState().appendChunk(caseId, chunk, written / total);
  }
  if (!stillGenerating()) return;
  const sections = useReportStore.getState().drafts[caseId]?.sections ?? [];
  useReportStore.getState().completeDraft(caseId, sections);
  await audit(
    'report.generated',
    { type: 'report', id: caseId },
    {
      actor: AI_ACTOR,
      reason: `Draft v${useReportStore.getState().drafts[caseId]?.version} with ${sections.length} sections`,
    },
  );
}

function startGeneration(caseId: string): Promise<void> {
  const running = inFlight.get(caseId);
  if (running) return running;
  const p = generate(caseId)
    .catch((e) => console.error(`Report generation for ${caseId} failed`, e))
    .finally(() => inFlight.delete(caseId));
  inFlight.set(caseId, p);
  return p;
}

/** Stage 7: queue a draft (escalation calls this) and stream it in the background. */
export async function requestDraft(caseId: string): Promise<void> {
  const actor = currentActor();
  useReportStore.getState().requestDraft(caseId, actor);
  await audit(
    'report.requested',
    { type: 'report', id: caseId },
    { actor, reason: 'Suspicious activity report draft requested' },
  );
  void startGeneration(caseId);
}

/** Restarts drafts interrupted by a page reload. */
export function resumeDrafts(): void {
  for (const d of Object.values(useReportStore.getState().drafts)) {
    if (d.status === 'queued' || d.status === 'generating') void startGeneration(d.caseId);
  }
}

export async function editSection(caseId: string, sectionId: string, body: string): Promise<void> {
  const { before, after } = useReportStore.getState().editSection(caseId, sectionId, body);
  const title = useReportStore
    .getState()
    .drafts[caseId]?.sections.find((s) => s.id === sectionId)?.title;
  await audit(
    'report.edited',
    { type: 'report', id: caseId },
    {
      reason: `Edited "${title}" (v${useReportStore.getState().drafts[caseId]?.version})`,
      before,
      after,
    },
  );
}

export async function submitForReview(caseId: string): Promise<void> {
  const actor = currentActor();
  useReportStore.getState().submitForReview(caseId, actor);
  await audit(
    'report.submitted',
    { type: 'report', id: caseId },
    { actor, reason: 'Submitted for second review (four-eyes)' },
  );
}

export async function approveReport(caseId: string, reason: string): Promise<void> {
  const actor = currentActor();
  useReportStore.getState().approve(caseId, actor, reason);
  await audit('report.approved', { type: 'report', id: caseId }, { actor, reason: reason.trim() });
}

export async function rejectReport(caseId: string, reason: string): Promise<void> {
  const actor = currentActor();
  useReportStore.getState().reject(caseId, actor, reason);
  await audit('report.rejected', { type: 'report', id: caseId }, { actor, reason: reason.trim() });
}

/** Re-drafts after a rejection. */
export const redraft = requestDraft;

export function exportMarkdown(caseId: string): string {
  const d = useReportStore.getState().drafts[caseId];
  if (!d) throw new DomainError('NOT_FOUND', `No report draft for ${caseId}`);
  const c = useCaseStore.getState().cases[caseId];
  const name = c ? (useDataStore.getState().clients[c.clientId]?.name ?? c.clientId) : caseId;
  return reportToMarkdown(
    `Suspicious activity report – ${name} (${caseId}) v${d.version}`,
    d.sections,
    DRAFT_BANNER,
  );
}
