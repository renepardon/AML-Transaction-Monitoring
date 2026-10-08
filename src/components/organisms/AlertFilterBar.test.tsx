import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetUi } from '@/test/storeHelpers';
import { useUiStore } from '@/stores/useUiStore';
import { AlertFilterBar } from './AlertFilterBar';

describe('AlertFilterBar', () => {
  beforeEach(resetUi);

  it('writes filters to the UI store', async () => {
    render(<AlertFilterBar />);
    await userEvent.click(screen.getByLabelText('Score 5'));
    await userEvent.click(screen.getByRole('button', { name: 'Show dismissed' }));
    expect(useUiStore.getState().alertFilters).toMatchObject({ scores: [5], showDismissed: true });
  });
});
