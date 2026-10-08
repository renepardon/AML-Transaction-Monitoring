import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { escalatedC1003 } from '@/test/reportFixture';
import { useAuditStore } from '@/stores/useAuditStore';
import { useReportStore } from '@/stores/useReportStore';
import { useUiStore } from '@/stores/useUiStore';
import { ReportDraftView } from './ReportDraftView';

describe('ReportDraftView', () => {
  beforeEach(async () => {
    await escalatedC1003();
    useUiStore.getState().selectReport('CASE-C1003');
  });

  it('shows the banner, the 9 MROS sections and the AI label', () => {
    render(<ReportDraftView />);
    expect(screen.getByText('Draft for human review – not submitted')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(9);
    expect(screen.getByText(/AI-generated/)).toBeInTheDocument();
  });

  it('edits a section, bumps the version and audits it', async () => {
    render(<ReportDraftView />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit 3. Summary of the suspicion' }));
    const box = screen.getByRole('textbox', { name: '3. Summary of the suspicion' });
    await userEvent.clear(box);
    await userEvent.type(box, 'Rewritten summary.');
    await userEvent.click(screen.getByRole('button', { name: 'Save section' }));
    expect(useReportStore.getState().drafts['CASE-C1003']?.version).toBe(2);
    expect(useAuditStore.getState().entries.at(-1)?.action).toBe('report.edited');
    expect(await screen.findByText('Rewritten summary.')).toBeInTheDocument();
  });
});
