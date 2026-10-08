export type ActorKind = 'system' | 'ai' | 'analyst';

export interface Actor {
  id: string;
  name: string;
  kind: ActorKind;
  role?: string;
}

export const SYSTEM_ACTOR: Actor = {
  id: 'system',
  name: 'System',
  kind: 'system',
  role: 'Pipeline',
};

export const AI_ACTOR: Actor = {
  id: 'mock-claude',
  name: 'Claude (simulated)',
  kind: 'ai',
  role: 'Local deterministic provider',
};

export const SEED_ANALYSTS: Actor[] = [
  { id: 'analyst-keller', name: 'A. Keller', kind: 'analyst', role: 'AML Analyst' },
  { id: 'officer-rossi', name: 'M. Rossi', kind: 'analyst', role: 'Compliance Officer' },
];

export function actorLabel(actor: Actor): string {
  return actor.role ? `${actor.name} – ${actor.role}` : actor.name;
}
