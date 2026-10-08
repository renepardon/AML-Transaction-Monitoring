import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useUiStore } from '@/stores/useUiStore';
import { DecisionBar } from './DecisionBar';

describe('DecisionBar', () => {
  it('opens the decision dialog with the chosen decision and shows the actor', async () => {
    await runSamplePipeline();
    render(<DecisionBar caseId="CASE-C1002" />);
    expect(screen.getByText('A. Keller')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Escalate/ }));
    expect(useUiStore.getState().dialog).toEqual({
      kind: 'decision',
      caseId: 'CASE-C1002',
      decision: 'escalate',
    });
  });
});
