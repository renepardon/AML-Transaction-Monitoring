import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { AiExplanationCard } from './AiExplanationCard';

describe('AiExplanationCard', () => {
  beforeEach(runSamplePipeline);

  it('shows the AI label, explanation and facts', () => {
    render(<AiExplanationCard caseId="CASE-C1003" />);
    expect(
      screen.getAllByText('AI-generated · simulated Claude · decision stays with the analyst')
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/paid out 98\.6 % of it/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Pass-through to the United Arab Emirates|Pass-through to United Arab Emirates/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('No mitigating evidence found.')).toBeInTheDocument();
  });
});
