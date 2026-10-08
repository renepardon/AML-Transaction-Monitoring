import { render, screen } from '@testing-library/react';
import { IntegrityBadge } from './IntegrityBadge';

describe('IntegrityBadge', () => {
  it('shows a text label, not only color', () => {
    const { rerender } = render(<IntegrityBadge ok />);
    expect(screen.getByText('Data integrity OK')).toBeInTheDocument();
    rerender(<IntegrityBadge ok={false} />);
    expect(screen.getByText('Integrity issues')).toBeInTheDocument();
  });
});
