import { render, screen } from '@testing-library/react';
import { loadSampleIntoStore } from '@/test/storeHelpers';
import { useDataStore } from '@/stores/useDataStore';
import { ReconciliationTable } from './ReconciliationTable';

describe('ReconciliationTable', () => {
  it('shows an empty state without data', () => {
    useDataStore.getState().reset();
    render(<ReconciliationTable />);
    expect(screen.getByText('No statements loaded.')).toBeInTheDocument();
  });

  it('lists all 18 statements as reconciled', async () => {
    await loadSampleIntoStore();
    render(<ReconciliationTable />);
    expect(screen.getAllByText('Reconciled')).toHaveLength(18);
    expect(screen.getByText('C1003-202607')).toBeInTheDocument();
  });
});
