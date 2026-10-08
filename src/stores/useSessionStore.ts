import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { SEED_ANALYSTS, type Actor } from '@/domain/actors';
import { DomainError } from '@/domain/errors';
import { devtoolsOptions, persistOptions } from './persistConfig';

interface SessionState {
  actors: Actor[];
  currentActor: Actor;
  switchActor: (actorId: string) => Actor;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      (set, get) => ({
        actors: SEED_ANALYSTS,
        currentActor: SEED_ANALYSTS[0]!,
        switchActor: (actorId) => {
          const actor = get().actors.find((a) => a.id === actorId);
          if (!actor) throw new DomainError('NOT_FOUND', `Unknown actor ${actorId}`);
          set({ currentActor: actor });
          return actor;
        },
        resetSession: () => set({ actors: SEED_ANALYSTS, currentActor: SEED_ANALYSTS[0]! }),
      }),
      persistOptions<SessionState>('session', 1),
    ),
    devtoolsOptions('session'),
  ),
);
