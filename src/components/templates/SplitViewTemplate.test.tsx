import { render, screen } from '@testing-library/react';
import { SplitViewTemplate } from './SplitViewTemplate';

describe('SplitViewTemplate', () => {
  it('renders a labelled list and detail region', () => {
    render(<SplitViewTemplate list={<p>L</p>} detail={<p>D</p>} />);
    expect(screen.getByRole('region', { name: 'Case list' })).toHaveTextContent('L');
    expect(screen.getByRole('region', { name: 'Case detail' })).toHaveTextContent('D');
  });
});
