import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { escalatedC1003 } from '@/test/reportFixture';
import { submitForReview } from '@/services/reporting';
import { useReportStore } from '@/stores/useReportStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUiStore } from '@/stores/useUiStore';
import { ReviewDialog } from './ReviewDialog';

describe('ReviewDialog', () => {
  beforeEach(async () => {
    await escalatedC1003();
    await submitForReview('CASE-C1003');
    useUiStore.getState().openDialog({ kind: 'review', caseId: 'CASE-C1003', action: 'approve' });
  });

  it('warns the escalating analyst and keeps the report in review', async () => {
    render(<ReviewDialog />);
    expect(screen.getByRole('alert')).toHaveTextContent(/escalated this case yourself/);
    await userEvent.type(screen.getByLabelText('Reason (required)'), 'self approval attempt');
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(useReportStore.getState().drafts['CASE-C1003']?.status).toBe('in_review');
  });

  it('approves as a second analyst', async () => {
    useSessionStore.getState().switchActor('officer-rossi');
    render(<ReviewDialog />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Reason (required)'), 'facts complete, approve');
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(useReportStore.getState().drafts['CASE-C1003']?.status).toBe('approved');
  });
});
