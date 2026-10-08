import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useUiStore } from '@/stores/useUiStore';
import { CaseHotkeys } from './CaseHotkeys';

describe('CaseHotkeys', () => {
  it('J/K move through cases and E opens the escalate dialog', async () => {
    await runSamplePipeline();
    render(<CaseHotkeys />);
    await userEvent.keyboard('j');
    const first = useUiStore.getState().selectedCaseId;
    expect(first).toMatch(/^CASE-/);
    await userEvent.keyboard('j');
    expect(useUiStore.getState().selectedCaseId).not.toBe(first);
    await userEvent.keyboard('k');
    expect(useUiStore.getState().selectedCaseId).toBe(first);
    await userEvent.keyboard('e');
    expect(useUiStore.getState().dialog).toMatchObject({
      kind: 'decision',
      decision: 'escalate',
      caseId: first,
    });
  });
});
