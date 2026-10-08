import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { RuleEvidenceList } from './RuleEvidenceList';

describe('RuleEvidenceList', () => {
  it('lists each triggered rule with formatted metrics', async () => {
    await runSamplePipeline();
    render(<RuleEvidenceList caseId="CASE-C1002" />);
    expect(screen.getByText('Triggered rules')).toHaveTextContent('5');
    expect(screen.getAllByText(/9 cash deposits between/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Deposits').length).toBe(1);
    expect(screen.getAllByText('Internal risk list – demo policy').length).toBeGreaterThan(0);
  });
});
