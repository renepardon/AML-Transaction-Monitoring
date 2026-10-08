import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetAllStores } from '@/test/storeHelpers';
import { App } from './App';

describe('App', () => {
  beforeEach(resetAllStores);

  it('boots with the sample data and navigates between pages', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(
      await screen.findByText('Data integrity OK · 18 statements reconciled'),
    ).toBeInTheDocument();
    await screen.findByRole(
      'listitem',
      { name: /Stage 4 Open case: Done, 3 cases/ },
      { timeout: 4000 },
    );
    await userEvent.click(screen.getByRole('button', { name: /Cases/ }));
    expect(screen.getByRole('region', { name: 'Case list' })).toBeInTheDocument();
  });
});
