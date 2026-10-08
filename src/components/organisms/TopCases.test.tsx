import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useUiStore } from '@/stores/useUiStore';
import { TopCases } from './TopCases';

describe('TopCases', () => {
  it('lists the top 3 cases and opens one', async () => {
    await runSamplePipeline();
    render(<TopCases />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: /Elsa Brunner/ }));
    expect(useUiStore.getState()).toMatchObject({ view: 'cases', selectedCaseId: 'CASE-C1001' });
  });
});
