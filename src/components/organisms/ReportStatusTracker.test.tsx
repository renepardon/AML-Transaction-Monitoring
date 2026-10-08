import { render, screen } from '@testing-library/react';
import { ReportStatusTracker } from './ReportStatusTracker';

describe('ReportStatusTracker', () => {
  it('marks the current step', () => {
    render(<ReportStatusTracker status="in_review" />);
    expect(screen.getByText('In review').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('shows a rejected end state', () => {
    render(<ReportStatusTracker status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });
});
