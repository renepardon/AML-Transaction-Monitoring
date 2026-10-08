import { render, screen } from '@testing-library/react';
import { Table, TableBody } from '@/components/ui/table';
import { buildTx } from '@/test/builders';
import { TransactionRow } from './TransactionRow';

describe('TransactionRow', () => {
  it('highlights evidence and shows the pass-through link', () => {
    const tx = buildTx({
      amount: 25_000_000,
      bookingDate: '2026-07-14',
      counterparty: { name: 'Eastgate Holdings Ltd', country: 'HK', iban: null },
      remittance: 'Consulting fee',
    });
    render(
      <Table>
        <TableBody>
          <TransactionRow
            tx={tx}
            evidence
            expectedCountries={['CH']}
            link={{ group: 'PT1', role: 'in' }}
          />
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('row')).toHaveAttribute('data-evidence', 'true');
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('PT1 → in')).toBeInTheDocument();
    expect(screen.getByText('14.07.2026')).toBeInTheDocument();
  });
});
