import { render, screen } from '@testing-library/react';
import { ThresholdReference } from './ThresholdReference';

describe('ThresholdReference', () => {
  it('cites the legal basis and dates the country lists', () => {
    render(<ThresholdReference />);
    expect(screen.getByText(/GwV-FINMA Art. 51 para. 1 lit. b/)).toBeInTheDocument();
    expect(screen.getByText(/as of June 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Internal risk list – demo policy \(not FATF\)/)).toBeInTheDocument();
  });
});
