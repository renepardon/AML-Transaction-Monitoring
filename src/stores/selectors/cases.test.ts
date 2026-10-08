import { compareCases, type CaseListView } from './cases';

const v = (id: string, score: number, openedAt: string): CaseListView => ({
  id,
  clientId: id,
  clientName: id,
  score,
  status: 'open',
  ruleIds: [],
  openedAt,
  updatedAt: openedAt,
});

describe('case selectors', () => {
  it('sorts by score descending, then newest first', () => {
    const sorted = [v('a', 4, '2026-10-01'), v('b', 5, '2026-09-01'), v('c', 4, '2026-10-05')].sort(
      compareCases,
    );
    expect(sorted.map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });
});
