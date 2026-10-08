import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { TriageProgressBar } from './TriageProgressBar';

describe('TriageProgressBar', () => {
  it('shows completed triage progress', async () => {
    await runSamplePipeline();
    render(<TriageProgressBar />);
    expect(screen.getByText('Triage complete')).toBeInTheDocument();
    expect(screen.getByText('26 / 26 scored')).toBeInTheDocument();
  });
});
