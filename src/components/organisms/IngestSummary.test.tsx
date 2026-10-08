import { render, screen } from '@testing-library/react';
import { loadSampleIntoStore } from '@/test/storeHelpers';
import { IngestSummary } from './IngestSummary';

describe('IngestSummary', () => {
  it('shows counts and the integrity badge', async () => {
    await loadSampleIntoStore();
    render(<IngestSummary />);
    expect(screen.getByText('193')).toBeInTheDocument();
    expect(screen.getByText('Data integrity OK')).toBeInTheDocument();
  });
});
