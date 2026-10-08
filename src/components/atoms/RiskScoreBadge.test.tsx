import { render, screen } from '@testing-library/react';
import { RiskScoreBadge } from './RiskScoreBadge';

describe('RiskScoreBadge', () => {
  it('conveys the score as number and label, not only color', () => {
    render(<RiskScoreBadge score={5} />);
    expect(screen.getByLabelText('Risk score 5 of 5, Very high')).toHaveTextContent('5· Very high');
  });
});
