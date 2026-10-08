import { render, screen } from '@testing-library/react';
import { loadSampleIntoStore } from '@/test/storeHelpers';
import { useDataStore } from '@/stores/useDataStore';
import { IngestPanel } from './IngestPanel';

describe('IngestPanel', () => {
  it('lists the loaded sources and offers an accessible upload input', async () => {
    await loadSampleIntoStore();
    render(<IngestPanel />);
    expect(screen.getAllByRole('listitem')[3]).toHaveTextContent('client_profiles.csv');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByLabelText('Upload statement or profile files')).toHaveAttribute(
      'accept',
      '.xml,.csv',
    );
  });

  it('shows the error state', () => {
    useDataStore.setState({ status: 'error', error: 'Boom', sources: [] });
    render(<IngestPanel />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
  });
});
