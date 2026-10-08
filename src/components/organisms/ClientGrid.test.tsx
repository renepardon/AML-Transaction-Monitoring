import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useUiStore } from '@/stores/useUiStore';
import { ClientGrid } from './ClientGrid';

describe('ClientGrid', () => {
  it('shows 6 client cards with sparklines and opens the detail', async () => {
    await runSamplePipeline();
    render(<ClientGrid />);
    expect(screen.getAllByRole('img', { name: /Inflow per month/ })).toHaveLength(6);
    await userEvent.click(screen.getByRole('button', { name: /Bäckerei Moser AG/ }));
    expect(useUiStore.getState().selectedClientId).toBe('C1005');
  });
});
