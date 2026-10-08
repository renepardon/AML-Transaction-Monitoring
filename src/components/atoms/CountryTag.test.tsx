import { render, screen } from '@testing-library/react';
import { CountryTag } from './CountryTag';

describe('CountryTag', () => {
  it('labels the internal list honestly (not FATF)', () => {
    render(<CountryTag code="HK" />);
    expect(screen.getByLabelText('Hong Kong · Internal risk list – demo policy')).toHaveTextContent(
      'HK',
    );
  });

  it('flags unexpected countries', () => {
    render(<CountryTag code="GB" expected={false} />);
    expect(screen.getByLabelText(/not in expected countries/)).toBeInTheDocument();
  });
});
