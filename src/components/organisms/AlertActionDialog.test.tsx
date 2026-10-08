import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuditStore } from '@/stores/useAuditStore';
import { useUiStore } from '@/stores/useUiStore';
import { AlertActionDialog } from './AlertActionDialog';

describe('AlertActionDialog', () => {
  beforeEach(runSamplePipeline);

  it('dismisses Sara Huber with a reason and writes an audit entry', async () => {
    const sara = Object.values(useAlertStore.getState().alerts).find(
      (a) => a.hit.clientId === 'C1006',
    )!;
    useUiStore.getState().openDialog({ kind: 'alert', alertId: sara.id, action: 'dismiss' });
    render(<AlertActionDialog />);
    const submit = screen.getByRole('button', { name: 'Dismiss alert' });
    expect(submit).toBeDisabled();
    await userEvent.type(
      screen.getByLabelText('Reason (required)'),
      'Car purchase with contract, bonus received',
    );
    expect(submit).toBeEnabled();
    await userEvent.click(submit);
    expect(useAlertStore.getState().alerts[sara.id]?.dismissal?.reason).toBe(
      'Car purchase with contract, bonus received',
    );
    expect(useAuditStore.getState().entries.at(-1)).toMatchObject({
      action: 'alert.dismissed',
      actor: { name: 'A. Keller' },
    });
    expect(useUiStore.getState().dialog).toBeNull();
  });
});
