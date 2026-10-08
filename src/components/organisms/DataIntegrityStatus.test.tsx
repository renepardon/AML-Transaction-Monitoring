import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { DataIntegrityStatus } from './DataIntegrityStatus';

describe('DataIntegrityStatus', () => {
  it('shows the reconciliation result', async () => {
    await runSamplePipeline();
    render(<DataIntegrityStatus />);
    expect(screen.getByText('Data integrity OK · 18 statements reconciled')).toBeInTheDocument();
  });
});
