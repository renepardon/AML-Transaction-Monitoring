import { useCaseStore } from './useCaseStore';

describe('persist migrate', () => {
  it('migrates v0 case state from localStorage on rehydrate', async () => {
    localStorage.setItem(
      'aml-poc:cases',
      JSON.stringify({
        version: 0,
        state: {
          cases: {
            'CASE-C1': {
              id: 'CASE-C1',
              clientId: 'C1',
              alertIds: ['a'],
              score: 4,
              status: 'open',
              notes: [],
              openedAt: 'x',
              updatedAt: 'x',
            },
          },
        },
      }),
    );
    await useCaseStore.persist.rehydrate();
    expect(useCaseStore.getState().cases['CASE-C1']).toMatchObject({
      history: [],
      conversation: [],
      score: 4,
    });
    expect(JSON.parse(localStorage.getItem('aml-poc:cases')!).version).toBe(1);
  });
});
