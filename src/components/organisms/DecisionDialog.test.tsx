import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useCaseStore } from '@/stores/useCaseStore';
import { useUiStore } from '@/stores/useUiStore';
import { DecisionDialog } from './DecisionDialog';

describe('DecisionDialog', () => {
  beforeEach(runSamplePipeline);

  it('disables submit until the reason is valid, then closes the case', async () => {
    useUiStore.getState().openDialog({ kind: 'decision', caseId: 'CASE-C1001', decision: 'close' });
    render(<DecisionDialog />);
    const submit = screen.getByRole('button', { name: 'Close case' });
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Reason (required)'), 'short');
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Reason (required)'), ' but now long enough');
    expect(submit).toBeEnabled();
    expect(screen.getByText('Recorded as A. Keller – AML Analyst')).toBeInTheDocument();
    await userEvent.click(submit);
    expect(useCaseStore.getState().cases['CASE-C1001']?.status).toBe('closed_false_positive');
    expect(useUiStore.getState().drafts['decision:CASE-C1001']).toBeUndefined();
  });
});
