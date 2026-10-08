import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  GENESIS_HASH,
  hashEntry,
  verifyChain,
  type AuditEntry,
  type AuditEntryDraft,
  type ChainVerification,
} from '@/domain/audit/hashChain';
import { devtoolsOptions, persistOptions } from './persistConfig';

export type AuditInput = Omit<AuditEntryDraft, 'seq' | 'id' | 'at' | 'prevHash'> & { at?: string };

export type VerificationState =
  | { status: 'idle' }
  | { status: 'verifying' }
  | ({ status: 'done'; checkedAt: string } & ChainVerification);

interface AuditState {
  entries: AuditEntry[];
  /** Hash the first entry links to: genesis, or the last hash before a demo reset. */
  anchorHash: string;
  verification: VerificationState;
  append: (input: AuditInput) => Promise<AuditEntry>;
  verifyChain: () => Promise<ChainVerification>;
  /** Only used by "Reset demo", after the final audit entry has been written. */
  startNewChain: () => void;
}

// Serialises appends so seq and prevHash are assigned in call order despite async hashing.
let appendQueue: Promise<unknown> = Promise.resolve();

export const useAuditStore = create<AuditState>()(
  devtools(
    persist(
      (set, get) => ({
        entries: [],
        anchorHash: GENESIS_HASH,
        verification: { status: 'idle' },
        append: (input) => {
          const run = async () => {
            const { entries, anchorHash } = get();
            const last = entries[entries.length - 1];
            const seq = (last?.seq ?? 0) + 1;
            const draft: AuditEntryDraft = {
              ...input,
              seq,
              id: `AUD-${String(seq).padStart(5, '0')}`,
              at: input.at ?? new Date().toISOString(),
              prevHash: last?.hash ?? anchorHash,
            };
            const entry: AuditEntry = { ...draft, hash: await hashEntry(draft) };
            set((s) => ({ entries: [...s.entries, entry] }));
            return entry;
          };
          const next = appendQueue.then(run, run);
          appendQueue = next.catch(() => undefined);
          return next;
        },
        verifyChain: async () => {
          set({ verification: { status: 'verifying' } });
          const { entries, anchorHash } = get();
          const result = await verifyChain(entries, anchorHash);
          set({ verification: { status: 'done', checkedAt: new Date().toISOString(), ...result } });
          return result;
        },
        startNewChain: () => {
          const last = get().entries[get().entries.length - 1];
          set({
            entries: [],
            anchorHash: last?.hash ?? GENESIS_HASH,
            verification: { status: 'idle' },
          });
        },
      }),
      persistOptions<AuditState, Pick<AuditState, 'entries' | 'anchorHash'>>('audit', 1, {
        partialize: (s) => ({ entries: s.entries, anchorHash: s.anchorHash }),
      }),
    ),
    devtoolsOptions('audit'),
  ),
);
