import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { TransactionTimeline } from './TransactionTimeline';

describe('TransactionTimeline', () => {
  beforeEach(runSamplePipeline);

  it('highlights evidence and links pass-through in → out', () => {
    render(<TransactionTimeline caseId="CASE-C1003" />);
    expect(screen.getByText('PT1 → in')).toBeInTheDocument();
    expect(screen.getByText('PT1 out →')).toBeInTheDocument();
    expect(screen.getByText('PT2 → in')).toBeInTheDocument();
  });

  it('filters to evidence only', async () => {
    render(<TransactionTimeline caseId="CASE-C1003" />);
    const all = screen.getAllByRole('row').length;
    await userEvent.click(screen.getByRole('button', { name: 'Evidence only' }));
    expect(screen.getAllByRole('row').length).toBeLessThan(all);
    expect(
      screen
        .getAllByRole('row')
        .slice(1)
        .every((r) => r.getAttribute('data-evidence') === 'true'),
    ).toBe(true);
  });
});
