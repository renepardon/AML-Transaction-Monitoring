import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildClient } from '@/test/builders';
import { ClientCard } from './ClientCard';

const view = {
  client: buildClient({
    clientId: 'C1006',
    name: 'Sara Huber',
    occupation: 'Projektleiterin Versicherung',
  }),
  monthly: [
    { clientId: 'C1006', month: '2026-07', inflow: 985_000, outflow: 400_000, txCount: 5 },
    { clientId: 'C1006', month: '2026-08', inflow: 2_835_000, outflow: 400_000, txCount: 5 },
  ],
  alertCount: 1,
  caseStatus: null,
  maxRatio: 5.1,
};

describe('ClientCard', () => {
  it('shows profile facts, a labelled sparkline and opens on click', async () => {
    const onOpen = vi.fn();
    render(<ClientCard view={view} topScore={1} onOpen={onOpen} />);
    expect(screen.getByText('Sara Huber')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Inflow per month vs expected/ })).toBeInTheDocument();
    expect(screen.getByText(/peak 5.1× profile/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith('C1006');
  });
});
