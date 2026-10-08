import { useSessionStore } from './useSessionStore';

describe('useSessionStore', () => {
  beforeEach(() => useSessionStore.getState().resetSession());

  it('starts with A. Keller and can switch to M. Rossi', () => {
    expect(useSessionStore.getState().currentActor.name).toBe('A. Keller');
    useSessionStore.getState().switchActor('officer-rossi');
    expect(useSessionStore.getState().currentActor.role).toBe('Compliance Officer');
  });

  it('rejects unknown actors', () => {
    expect(() => useSessionStore.getState().switchActor('nobody')).toThrow(/Unknown actor/);
  });
});
