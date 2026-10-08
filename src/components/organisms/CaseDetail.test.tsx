import { render, screen } from '@testing-library/react';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useUiStore } from '@/stores/useUiStore';
import { CaseDetail } from './CaseDetail';

describe('CaseDetail', () => {
  beforeEach(runSamplePipeline);

  it('shows an empty state without selection', () => {
    render(<CaseDetail />);
    expect(screen.getByText(/Select a case/)).toBeInTheDocument();
  });

  it('composes the full case view for the selected case', () => {
    useUiStore.getState().selectCase('CASE-C1003');
    render(<CaseDetail />);
    expect(screen.getByRole('heading', { name: 'Nordstern Trading GmbH' })).toBeInTheDocument();
    expect(screen.getByText("Claude's assessment")).toBeInTheDocument();
    expect(screen.getByText('Flow vs profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close as false positive/ })).toBeInTheDocument();
  });
});
