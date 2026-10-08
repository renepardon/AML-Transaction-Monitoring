import { caseIdFor } from '../ids';

export interface ScoredAlert {
  id: string;
  clientId: string;
  score: number;
  /** Promoted alerts join a case regardless of score. */
  promoted?: boolean;
}

export interface CaseGroup {
  caseId: string;
  clientId: string;
  alertIds: string[];
  score: number;
}

/** Stage 4: alerts with score ≥ threshold (or promoted) grouped into one case per client. */
export function groupAlertsIntoCases(alerts: ScoredAlert[], threshold: number): CaseGroup[] {
  const groups = new Map<string, CaseGroup>();
  for (const a of alerts) {
    if (a.score < threshold && !a.promoted) continue;
    const g = groups.get(a.clientId) ?? {
      caseId: caseIdFor(a.clientId),
      clientId: a.clientId,
      alertIds: [],
      score: 0,
    };
    g.alertIds.push(a.id);
    g.score = Math.max(g.score, a.score);
    groups.set(a.clientId, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, alertIds: [...g.alertIds].sort() }))
    .sort((a, b) => b.score - a.score || a.clientId.localeCompare(b.clientId));
}
