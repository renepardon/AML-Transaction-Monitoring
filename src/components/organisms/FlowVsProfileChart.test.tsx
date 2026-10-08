import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { FlowVsProfileChart } from './FlowVsProfileChart';

describe('FlowVsProfileChart', () => {
  it('describes expected inflow and outflow from the profile', async () => {
    await runSamplePipeline();
    render(<FlowVsProfileChart clientId="C1006" />);
    expect(screen.getByText('Flow vs profile')).toBeInTheDocument();
    expect(
      screen.getByText(/expected inflow CHF\s9.800 and outflow CHF\s8.200/),
    ).toBeInTheDocument();
  });

  it('shows an empty state for an unknown client', async () => {
    await runSamplePipeline();
    render(<FlowVsProfileChart clientId="NOPE" />);
    expect(screen.getByText('No transactions.')).toBeInTheDocument();
  });
});
