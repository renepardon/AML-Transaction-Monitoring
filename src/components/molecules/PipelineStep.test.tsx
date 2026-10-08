import { render, screen } from '@testing-library/react';
import { PipelineStep } from './PipelineStep';

describe('PipelineStep', () => {
  it('announces stage, status and detail', () => {
    render(
      <ul>
        <PipelineStep
          stage={{
            index: 3,
            name: 'Triage',
            kind: 'ai',
            status: 'running',
            detail: '10/26 scored',
          }}
        />
      </ul>,
    );
    expect(
      screen.getByRole('listitem', { name: 'Stage 3 Triage: In progress, 10/26 scored' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('AI step')).toBeInTheDocument();
  });
});
