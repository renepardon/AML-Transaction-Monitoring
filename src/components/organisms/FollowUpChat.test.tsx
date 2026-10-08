import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useCaseStore } from '@/stores/useCaseStore';
import { FollowUpChat } from './FollowUpChat';

describe('FollowUpChat', () => {
  it('answers a suggested question and stores the conversation', async () => {
    await runSamplePipeline();
    render(<FollowUpChat caseId="CASE-C1003" />);
    await userEvent.click(screen.getByRole('button', { name: 'Which countries are involved?' }));
    expect(await screen.findByText(/Hong Kong \(HK\)/)).toBeInTheDocument();
    expect(useCaseStore.getState().cases['CASE-C1003']?.conversation).toHaveLength(2);
  });
});
