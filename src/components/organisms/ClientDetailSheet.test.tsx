import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useUiStore } from '@/stores/useUiStore';
import { ClientDetailSheet } from './ClientDetailSheet';

describe('ClientDetailSheet', () => {
  it('lists all transactions of the selected client', async () => {
    await runSamplePipeline();
    useUiStore.getState().selectClient('C1004');
    render(<ClientDetailSheet />);
    expect(await screen.findByRole('dialog', { name: 'Lukas Frei' })).toBeInTheDocument();
    expect(screen.getAllByText('Rhenus Logistics AG')).toHaveLength(3);
  });
});
