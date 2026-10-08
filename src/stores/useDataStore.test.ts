import { useDataStore } from './useDataStore';

describe('useDataStore', () => {
  beforeEach(() => useDataStore.getState().reset());

  it('loads the bundled sample data into normalized maps', async () => {
    const promise = useDataStore.getState().loadSampleData();
    expect(useDataStore.getState().status).toBe('loading');
    await promise;
    const s = useDataStore.getState();
    expect(s.status).toBe('ready');
    expect(Object.keys(s.transactions)).toHaveLength(193);
    expect(Object.keys(s.clients)).toEqual(['C1001', 'C1002', 'C1003', 'C1004', 'C1005', 'C1006']);
    expect(s.sources).toHaveLength(4);
    expect(s.ingestReport?.reconciliation.allOk).toBe(true);
  });

  it('goes to error state when too many files are given', async () => {
    const files = Array.from({ length: 11 }, (_, i) => new File(['x'], `${i}.csv`));
    await useDataStore.getState().loadFiles(files);
    expect(useDataStore.getState().status).toBe('error');
    expect(useDataStore.getState().error).toMatch(/At most 10/);
  });

  it('reset clears everything', async () => {
    await useDataStore.getState().loadSampleData();
    useDataStore.getState().reset();
    expect(useDataStore.getState().status).toBe('idle');
    expect(useDataStore.getState().transactions).toEqual({});
  });
});
