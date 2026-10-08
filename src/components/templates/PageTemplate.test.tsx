import { render, screen } from '@testing-library/react';
import { PageTemplate } from './PageTemplate';

describe('PageTemplate', () => {
  it('renders a heading, description, actions and content', () => {
    render(
      <PageTemplate title="Data" description="Sources" actions={<button>Go</button>}>
        <p>Body</p>
      </PageTemplate>,
    );
    expect(screen.getByRole('heading', { name: 'Data' })).toBeInTheDocument();
    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});
