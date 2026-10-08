import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetUi } from '@/test/storeHelpers';
import { useUiStore } from '@/stores/useUiStore';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  beforeEach(resetUi);

  it('shows the current view and toggles the theme', async () => {
    useUiStore.getState().navigate('data');
    render(<TopBar />);
    expect(screen.getByText('Data')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(useUiStore.getState().theme).toBe('dark');
  });
});
