import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useCaseStore } from '@/stores/useCaseStore';
import { useUiStore } from '@/stores/useUiStore';
import { CaseList } from './CaseList';

describe('CaseList', () => {
  beforeEach(runSamplePipeline);

  it('renders open cases in score order', () => {
    useCaseStore.setState((s) => ({
      cases: { ...s.cases, 'CASE-C1002': { ...s.cases['CASE-C1002']!, score: 4 } },
    }));
    render(<CaseList />);
    const items = within(screen.getByRole('list', { name: 'Open cases' })).getAllByRole('button');
    expect(items).toHaveLength(3);
    expect(items[2]).toHaveTextContent('Viktor Schaller');
    expect(within(items[2]!).getByRole('img', { name: /Risk score 4/ })).toBeInTheDocument();
  });

  it('selects a case through the UI store', async () => {
    render(<CaseList />);
    await userEvent.click(screen.getByRole('button', { name: /Nordstern/ }));
    expect(useUiStore.getState().selectedCaseId).toBe('CASE-C1003');
  });
});
