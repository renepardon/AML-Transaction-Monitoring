import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useUiStore } from '@/stores/useUiStore';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  it('opens a case by client name', async () => {
    await runSamplePipeline();
    useUiStore.getState().setCommandOpen(true);
    render(<CommandPalette />);
    await userEvent.type(screen.getByPlaceholderText(/client name/), 'Schaller');
    await userEvent.click(screen.getByRole('option', { name: /Viktor Schaller/ }));
    expect(useUiStore.getState()).toMatchObject({
      view: 'cases',
      selectedCaseId: 'CASE-C1002',
      commandOpen: false,
    });
  });
});
