import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { PipelineStrip } from './PipelineStrip';

describe('PipelineStrip', () => {
  it('shows 8 stages with live status', async () => {
    await runSamplePipeline();
    render(<PipelineStrip />);
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(
      screen.getByRole('listitem', { name: /Stage 3 Triage: Done, 26\/26 scored/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('listitem', { name: /Stage 6 Decide: Waiting for analyst/ }),
    ).toBeInTheDocument();
  });
});
