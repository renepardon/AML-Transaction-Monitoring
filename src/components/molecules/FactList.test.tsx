import { render, screen } from '@testing-library/react';
import { FactList } from './FactList';

describe('FactList', () => {
  it('lists facts with an accessible tone icon', () => {
    render(<FactList title="Mitigating" facts={['Contract reference']} tone="mitigating" />);
    expect(screen.getByText('Contract reference')).toBeInTheDocument();
    expect(screen.getByLabelText('Mitigating')).toBeInTheDocument();
  });

  it('shows an empty text', () => {
    render(<FactList title="Mitigating" facts={[]} tone="mitigating" emptyText="Nothing." />);
    expect(screen.getByText('Nothing.')).toBeInTheDocument();
  });
});
