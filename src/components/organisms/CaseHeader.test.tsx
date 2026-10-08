import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { CaseHeader } from './CaseHeader';

describe('CaseHeader', () => {
  it('shows client, risk category, masked IBAN and status', async () => {
    await runSamplePipeline();
    render(<CaseHeader caseId="CASE-C1002" />);
    expect(screen.getByRole('heading', { name: 'Viktor Schaller' })).toBeInTheDocument();
    expect(screen.getByText('Risk category: erhöht')).toBeInTheDocument();
    expect(screen.getByText('CH05 •••• 0002')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
