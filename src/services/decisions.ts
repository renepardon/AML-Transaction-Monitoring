import { AI_ACTOR } from '@/domain/actors';
import { caseIdFor } from '@/domain/ids';
import { DomainError } from '@/domain/errors';
import { validateReason } from '@/domain/reason';
import { RULE_META } from '@/domain/rules/types';
import { answerFollowUp } from '@/domain/triage/followUp';
import { monthlyAggregates } from '@/domain/rules/aggregates';
import { useAlertStore } from '@/stores/useAlertStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';
import { audit, currentActor } from './audit';
import { applyCaseGroups } from './pipeline';
import { requestDraft } from './reporting';

/** Low-score alert closed as false positive straight from the triage queue. */
export async function dismissAlert(alertId: string, reason: string): Promise<void> {
  const actor = currentActor();
  const before = useAlertStore.getState().alerts[alertId];
  const updated = useAlertStore.getState().dismissAlert(alertId, reason, actor);
  await audit(
    'alert.dismissed',
    { type: 'alert', id: alertId },
    {
      actor,
      reason: updated.dismissal?.reason,
      before: { score: before?.triage?.score ?? null, dismissed: false },
      after: { dismissed: true },
    },
  );
}

/** Low-score alert that the analyst wants investigated anyway. */
export async function promoteAlert(alertId: string, reason: string): Promise<void> {
  const actor = currentActor();
  const trimmed = validateReason(reason);
  const alert = useAlertStore.getState().alerts[alertId];
  if (!alert) throw new DomainError('NOT_FOUND', `Alert ${alertId} not found`);
  if (alert.dismissal)
    throw new DomainError('ALREADY_DECIDED', 'A dismissed alert cannot be promoted');
  useAlertStore.getState().markPromoted(alertId);
  await audit('alert.promoted', { type: 'alert', id: alertId }, { actor, reason: trimmed });
  await applyCaseGroups(
    [
      {
        caseId: caseIdFor(alert.hit.clientId),
        clientId: alert.hit.clientId,
        alertIds: [alertId],
        score: alert.triage?.score ?? 1,
      },
    ],
    actor,
  );
}

export async function addNote(caseId: string, text: string): Promise<void> {
  const actor = currentActor();
  const updated = useCaseStore.getState().addNote(caseId, text, actor);
  await audit(
    'case.note_added',
    { type: 'case', id: caseId },
    { actor, reason: updated.notes[updated.notes.length - 1]?.text },
  );
}

/** Stage 5: the analyst asks Claude a follow-up question; the answer is stored in the case. */
export async function askFollowUp(caseId: string, question: string): Promise<void> {
  const actor = currentActor();
  const q = question.trim();
  if (!q) throw new DomainError('VALIDATION_ERROR', 'Please enter a question');
  const c = useCaseStore.getState().cases[caseId];
  if (!c) throw new DomainError('NOT_FOUND', `Case ${caseId} not found`);
  const { clients, transactions } = useDataStore.getState();
  const client = clients[c.clientId];
  if (!client) throw new DomainError('NOT_FOUND', `Client ${c.clientId} not loaded`);
  const alerts = useAlertStore.getState().alerts;
  const clientTx = Object.values(transactions)
    .filter((t) => t.clientId === client.clientId)
    .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
  const otherCases = Object.values(useCaseStore.getState().cases)
    .filter((o) => o.id !== caseId)
    .map((o) => ({
      clientName: clients[o.clientId]?.name ?? o.clientId,
      rules: [
        ...new Set(
          o.alertIds
            .map((id) => alerts[id]?.hit.ruleId)
            .filter((r) => !!r)
            .map((r) => RULE_META[r!].name),
        ),
      ],
    }));
  const answer = answerFollowUp(
    {
      client,
      hits: c.alertIds
        .map((id) => alerts[id]?.hit)
        .filter((h) => !!h)
        .map((h) => h!),
      transactions: clientTx,
      monthly: monthlyAggregates(client.clientId, clientTx),
      caseScore: c.score,
      otherCases,
    },
    q,
  );
  const at = new Date().toISOString();
  const n = c.conversation.length;
  useCaseStore.getState().addConversation(caseId, [
    { id: `${caseId}-M${n + 1}`, role: 'analyst', text: q, actor, at },
    { id: `${caseId}-M${n + 2}`, role: 'ai', text: answer, actor: AI_ACTOR, at },
  ]);
  await audit('case.question_asked', { type: 'case', id: caseId }, { actor, reason: q });
}

export async function closeCase(caseId: string, reason: string): Promise<void> {
  const actor = currentActor();
  const before = useCaseStore.getState().cases[caseId]?.status;
  const updated = useCaseStore.getState().closeCase(caseId, reason, actor);
  await audit(
    'case.closed',
    { type: 'case', id: caseId },
    {
      actor,
      reason: updated.decision?.reason,
      before: { status: before },
      after: { status: updated.status },
    },
  );
}

/** Stage 6 → 7: escalation automatically requests a report draft. */
export async function escalateCase(caseId: string, reason: string): Promise<void> {
  const actor = currentActor();
  const before = useCaseStore.getState().cases[caseId]?.status;
  const updated = useCaseStore.getState().escalateCase(caseId, reason, actor);
  await audit(
    'case.escalated',
    { type: 'case', id: caseId },
    {
      actor,
      reason: updated.decision?.reason,
      before: { status: before },
      after: { status: updated.status },
    },
  );
  await requestDraft(caseId);
}

export async function reopenCase(caseId: string, reason: string): Promise<void> {
  const actor = currentActor();
  const before = useCaseStore.getState().cases[caseId]?.status;
  const updated = useCaseStore.getState().reopen(caseId, reason, actor);
  await audit(
    'case.reopened',
    { type: 'case', id: caseId },
    {
      actor,
      reason: updated.history[updated.history.length - 1]?.reopenReason,
      before: { status: before },
      after: { status: updated.status },
    },
  );
}
