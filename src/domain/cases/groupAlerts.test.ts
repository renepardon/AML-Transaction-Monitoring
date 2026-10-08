import { groupAlertsIntoCases } from './groupAlerts';

describe('groupAlertsIntoCases', () => {
  it('groups alerts with score ≥ threshold per client, score = max', () => {
    const groups = groupAlertsIntoCases(
      [
        { id: 'a', clientId: 'C1', score: 4 },
        { id: 'b', clientId: 'C1', score: 5 },
        { id: 'c', clientId: 'C2', score: 2 },
        { id: 'd', clientId: 'C3', score: 3 },
      ],
      3,
    );
    expect(groups).toEqual([
      { caseId: 'CASE-C1', clientId: 'C1', alertIds: ['a', 'b'], score: 5 },
      { caseId: 'CASE-C3', clientId: 'C3', alertIds: ['d'], score: 3 },
    ]);
  });

  it('includes promoted alerts below the threshold', () => {
    expect(
      groupAlertsIntoCases([{ id: 'c', clientId: 'C2', score: 1, promoted: true }], 3)[0]?.score,
    ).toBe(1);
  });
});
