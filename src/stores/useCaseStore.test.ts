import { SEED_ANALYSTS } from '@/domain/actors';
import { useCaseStore } from './useCaseStore';

const actor = SEED_ANALYSTS[0]!;
const group = (score = 5) => ({ caseId: 'CASE-C1', clientId: 'C1', alertIds: ['a'], score });

describe('useCaseStore', () => {
  beforeEach(() => useCaseStore.getState().resetCases());

  it('opens a case once and merges new alerts into an open case', () => {
    expect(useCaseStore.getState().openCasesFromAlerts([group(4)]).opened).toEqual(['CASE-C1']);
    const again = useCaseStore.getState().openCasesFromAlerts([{ ...group(5), alertIds: ['b'] }]);
    expect(again).toEqual({ opened: [], updated: ['CASE-C1'] });
    expect(useCaseStore.getState().cases['CASE-C1']).toMatchObject({
      alertIds: ['a', 'b'],
      score: 5,
      status: 'open',
    });
  });

  it('a decision without a valid reason throws', () => {
    useCaseStore.getState().openCasesFromAlerts([group()]);
    expect(() => useCaseStore.getState().closeCase('CASE-C1', '', actor)).toThrow(/reason/);
    expect(() => useCaseStore.getState().escalateCase('CASE-C1', ' too short ', actor)).toThrow(
      /at least 10/,
    );
  });

  it('cannot decide twice without reopen; reopen keeps history', () => {
    useCaseStore.getState().openCasesFromAlerts([group()]);
    useCaseStore.getState().escalateCase('CASE-C1', 'pass-through to AE confirmed', actor);
    expect(() =>
      useCaseStore.getState().closeCase('CASE-C1', 'changed my mind now', actor),
    ).toThrow(/Reopen/);
    useCaseStore.getState().reopen('CASE-C1', 'new documents received', actor);
    const c = useCaseStore.getState().cases['CASE-C1']!;
    expect(c.status).toBe('in_review');
    expect(c.history[0]).toMatchObject({
      type: 'escalated',
      reopenReason: 'new documents received',
    });
    expect(() => useCaseStore.getState().reopen('CASE-C1', 'reopen an open case', actor)).toThrow(
      /Only a decided/,
    );
  });

  it('notes move an open case to in review', () => {
    useCaseStore.getState().openCasesFromAlerts([group()]);
    useCaseStore.getState().addNote('CASE-C1', '  Called the client. ', actor);
    expect(useCaseStore.getState().cases['CASE-C1']).toMatchObject({
      status: 'in_review',
      notes: [{ text: 'Called the client.' }],
    });
    expect(() => useCaseStore.getState().addNote('CASE-C1', '   ', actor)).toThrow(/empty/);
  });
});
