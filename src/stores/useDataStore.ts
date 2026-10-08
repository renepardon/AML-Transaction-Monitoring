import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  buildDataset,
  readBrowserFiles,
  sampleSourceInputs,
  type Dataset,
  type IngestReport,
  type SourceFile,
} from '@/services/ingest';
import type { ClientProfile, Statement, Transaction } from '@/domain/types';
import { isDomainError } from '@/domain/errors';
import { devtoolsOptions } from './persistConfig';

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

interface DataState {
  sources: SourceFile[];
  statements: Record<string, Statement>;
  transactions: Record<string, Transaction>;
  clients: Record<string, ClientProfile>;
  ingestReport: IngestReport | null;
  status: DataStatus;
  error: string | null;
  loadSampleData: () => Promise<Dataset | null>;
  loadFiles: (files: File[]) => Promise<Dataset | null>;
  reset: () => void;
}

const byId = <T>(list: T[], key: (x: T) => string): Record<string, T> =>
  Object.fromEntries(list.map((x) => [key(x), x]));

const empty = {
  sources: [],
  statements: {},
  transactions: {},
  clients: {},
  ingestReport: null,
  status: 'idle' as DataStatus,
  error: null,
};

/** Not persisted: the dataset is always rebuilt from its sources. */
export const useDataStore = create<DataState>()(
  devtools((set) => {
    const load = async (getInputs: () => Promise<Parameters<typeof buildDataset>[0]>) => {
      set({ status: 'loading', error: null });
      try {
        const ds = await buildDataset(await getInputs());
        set({
          sources: ds.sources,
          statements: byId(ds.statements, (s) => s.id),
          transactions: byId(ds.transactions, (t) => t.id),
          clients: byId(ds.clients, (c) => c.clientId),
          ingestReport: ds.report,
          status: 'ready',
        });
        return ds;
      } catch (e) {
        set({ status: 'error', error: isDomainError(e) ? e.message : 'Loading failed' });
        return null;
      }
    };
    return {
      ...empty,
      loadSampleData: () => load(async () => sampleSourceInputs()),
      loadFiles: (files) => load(() => readBrowserFiles(files)),
      reset: () => set(empty),
    };
  }, devtoolsOptions('data')),
);
