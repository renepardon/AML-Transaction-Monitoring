import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { OverviewKpis } from './OverviewKpis';

describe('OverviewKpis', () => {
  it('shows accounts, transactions, open cases and escalations', async () => {
    await runSamplePipeline();
    render(<OverviewKpis />);
    expect(screen.getByText('Accounts monitored').parentElement?.parentElement).toHaveTextContent(
      '6',
    );
    expect(screen.getByText('193')).toBeInTheDocument();
    expect(screen.getByText('Open cases').parentElement?.parentElement).toHaveTextContent('3');
    expect(screen.getByText('Escalated').parentElement?.parentElement).toHaveTextContent('0');
  });
});
