import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseListItem } from './CaseListItem';

const item = {
  id: 'CASE-C1003',
  clientId: 'C1003',
  clientName: 'Nordstern Trading GmbH',
  score: 5,
  status: 'open' as const,
  ruleIds: ['R2_PASS_THROUGH' as const],
  openedAt: '2026-10-06T10:00:00Z',
  updatedAt: '',
};

describe('CaseListItem', () => {
  it('shows score ring, client, rule chips, age and status, and selects on click', async () => {
    const onSelect = vi.fn();
    render(
      <CaseListItem
        item={item}
        selected
        onSelect={onSelect}
        now={new Date('2026-10-06T10:05:00Z')}
      />,
    );
    expect(screen.getByRole('img', { name: /Risk score 5/ })).toBeInTheDocument();
    expect(screen.getByText('5 min ago')).toBeInTheDocument();
    expect(screen.getByText('R2')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true');
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('CASE-C1003');
  });
});
