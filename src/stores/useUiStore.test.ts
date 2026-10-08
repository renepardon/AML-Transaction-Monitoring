import { useUiStore } from './useUiStore';

describe('useUiStore', () => {
  beforeEach(() => useUiStore.getState().resetUi());

  it('navigates and closes the command palette', () => {
    useUiStore.getState().setCommandOpen(true);
    useUiStore.getState().navigate('cases');
    expect(useUiStore.getState()).toMatchObject({ view: 'cases', commandOpen: false });
  });

  it('keeps form drafts and dialogs in the store', () => {
    useUiStore.getState().setDraft('note:CASE-1', 'hello');
    useUiStore.getState().openDialog({ kind: 'decision', caseId: 'CASE-1', decision: 'close' });
    expect(useUiStore.getState().drafts['note:CASE-1']).toBe('hello');
    useUiStore.getState().clearDraft('note:CASE-1');
    useUiStore.getState().closeDialog();
    expect(useUiStore.getState().drafts).toEqual({});
    expect(useUiStore.getState().dialog).toBeNull();
  });

  it('persists only theme and view', () => {
    useUiStore.getState().setTheme('dark');
    useUiStore.getState().setDraft('x', 'y');
    const stored = JSON.parse(localStorage.getItem('aml-poc:ui') ?? '{}');
    expect(stored.state).toEqual({ theme: 'dark', view: 'overview' });
    expect(stored.version).toBe(1);
  });
});
