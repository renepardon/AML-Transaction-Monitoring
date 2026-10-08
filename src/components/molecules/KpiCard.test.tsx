import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
  it('shows label, value and hint', () => {
    render(<KpiCard label="Accounts monitored" value={6} hint="Jul–Sep 2026" icon={Users} />);
    expect(screen.getByText('Accounts monitored')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Jul–Sep 2026')).toBeInTheDocument();
  });
});
