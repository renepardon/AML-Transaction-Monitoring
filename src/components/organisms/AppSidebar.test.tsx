import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetUi } from '@/test/storeHelpers';
import { useUiStore } from '@/stores/useUiStore';
import { AppSidebar } from './AppSidebar';

describe('AppSidebar', () => {
  beforeEach(resetUi);

  it('navigates via the store and marks the current page', async () => {
    render(<AppSidebar />);
    await userEvent.click(screen.getByRole('button', { name: /Audit log/ }));
    expect(useUiStore.getState().view).toBe('audit');
    expect(screen.getByRole('button', { name: /Audit log/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
