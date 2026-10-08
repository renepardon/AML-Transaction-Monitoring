import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { escalatedC1003 } from '@/test/reportFixture';
import { useReportStore } from '@/stores/useReportStore';
import { useUiStore } from '@/stores/useUiStore';
import { ReportActions } from './ReportActions';

describe('ReportActions', () => {
  it('submits for review, then offers approve and reject', async () => {
    await escalatedC1003();
    render(<ReportActions caseId="CASE-C1003" />);
    await userEvent.click(screen.getByRole('button', { name: /Submit for review/ }));
    expect(useReportStore.getState().drafts['CASE-C1003']?.status).toBe('in_review');
    await userEvent.click(await screen.findByRole('button', { name: /Approve/ }));
    expect(useUiStore.getState().dialog).toEqual({
      kind: 'review',
      caseId: 'CASE-C1003',
      action: 'approve',
    });
    expect(screen.getByRole('button', { name: /Print/ })).toBeEnabled();
  });
});
