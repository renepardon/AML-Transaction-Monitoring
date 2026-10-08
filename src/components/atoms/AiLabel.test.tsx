import { render, screen } from '@testing-library/react';
import { AiLabel } from './AiLabel';

describe('AiLabel', () => {
  it('always states that the output is AI-generated and simulated', () => {
    render(<AiLabel />);
    expect(
      screen.getByText('AI-generated · simulated Claude · decision stays with the analyst'),
    ).toBeInTheDocument();
  });
});
