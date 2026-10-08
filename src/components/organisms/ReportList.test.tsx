import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { escalatedC1003 } from '@/test/reportFixture';
import { resetAllStores } from '@/test/storeHelpers';
import { useUiStore } from '@/stores/useUiStore';
import { ReportList } from './ReportList';

describe('ReportList', () => {
  it('shows an empty state', () => {
    resetAllStores();
    render(<ReportList />);
    expect(screen.getByText(/No drafts yet/)).toBeInTheDocument();
  });

  it('lists drafts and selects one', async () => {
    await escalatedC1003();
    render(<ReportList />);
    await userEvent.click(screen.getByRole('button', { name: /Nordstern Trading GmbH/ }));
    expect(useUiStore.getState().selectedReportId).toBe('CASE-C1003');
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
