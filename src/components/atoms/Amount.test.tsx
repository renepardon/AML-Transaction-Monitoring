import { render, screen } from '@testing-library/react';
import { Amount } from './Amount';

describe('Amount', () => {
  it('formats Rappen as CHF with a sign for debits', () => {
    render(<Amount value={24_650_000} direction="DBIT" rounded />);
    expect(screen.getByText(/−CHF\s246.500/)).toBeInTheDocument();
  });

  it('shows cents by default', () => {
    render(<Amount value={5_312} />);
    expect(screen.getByText(/CHF\s53\.12/)).toBeInTheDocument();
  });
});
