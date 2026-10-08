import { render, screen } from '@testing-library/react';
import { MaskedIban } from './MaskedIban';

describe('MaskedIban', () => {
  it('never shows the full IBAN', () => {
    render(<MaskedIban iban="CH3208146000100100001" />);
    expect(screen.getByText('CH32 •••• 0001')).toBeInTheDocument();
    expect(screen.queryByText(/08146000/)).not.toBeInTheDocument();
  });
});
