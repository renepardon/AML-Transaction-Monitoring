import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useUiStore } from '@/stores/useUiStore';
import { AlertQueueTable } from './AlertQueueTable';

describe('AlertQueueTable', () => {
  beforeEach(runSamplePipeline);

  it('lists all 26 alerts sorted by score, with Sara Huber last and dismissable', () => {
    render(<AlertQueueTable />);
    const rows = within(screen.getByRole('list', { name: 'Alerts' })).getAllByRole('listitem');
    expect(rows).toHaveLength(26);
    expect(rows[25]).toHaveTextContent('Sara Huber');
    expect(within(rows[25]!).getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(within(rows[0]!).getByRole('button', { name: 'Open case' })).toBeInTheDocument();
  });

  it('filters by rule chip', async () => {
    render(<AlertQueueTable />);
    await userEvent.click(screen.getByLabelText('R1 Structuring'));
    expect(
      within(screen.getByRole('list', { name: 'Alerts' })).getAllByRole('listitem'),
    ).toHaveLength(1);
  });

  it('dismiss button sets the dialog in the UI store', async () => {
    useUiStore.getState().setAlertFilters({ scores: [1] });
    render(<AlertQueueTable />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(useUiStore.getState().dialog).toMatchObject({ kind: 'alert', action: 'dismiss' });
  });
});
