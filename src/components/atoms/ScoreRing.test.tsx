import { render, screen } from '@testing-library/react';
import { ScoreRing } from './ScoreRing';

describe('ScoreRing', () => {
  it('shows the number with an accessible label', () => {
    render(<ScoreRing score={4} />);
    expect(screen.getByRole('img', { name: 'Risk score 4 of 5, High' })).toHaveTextContent('4');
  });

  it('handles a missing score', () => {
    render(<ScoreRing score={null} />);
    expect(screen.getByRole('img', { name: 'Not scored yet' })).toHaveTextContent('–');
  });
});
