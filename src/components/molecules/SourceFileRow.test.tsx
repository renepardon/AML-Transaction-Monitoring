import { render, screen } from '@testing-library/react';
import { SourceFileRow } from './SourceFileRow';

const base = {
  name: 'a.xml',
  size: 2048,
  sha256: 'ab'.repeat(32),
  kind: 'camt053' as const,
  records: 60,
};

describe('SourceFileRow', () => {
  it('shows name, size, record count and short hash', () => {
    render(
      <ul>
        <SourceFileRow source={{ ...base, status: 'ok' }} />
      </ul>,
    );
    expect(screen.getByText('a.xml')).toBeInTheDocument();
    expect(screen.getByText(/60 records/)).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText(/sha256 ababababab/)).toBeInTheDocument();
  });

  it('shows the rejection reason', () => {
    render(
      <ul>
        <SourceFileRow source={{ ...base, status: 'rejected', error: 'Too big' }} />
      </ul>,
    );
    expect(screen.getByText('Rejected: Too big')).toBeInTheDocument();
  });
});
