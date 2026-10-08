import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetUi } from '@/test/storeHelpers';
import { useUiStore } from '@/stores/useUiStore';
import { GlobalHotkeys } from './GlobalHotkeys';

describe('GlobalHotkeys', () => {
  it('⌘K toggles the command palette', async () => {
    resetUi();
    render(<GlobalHotkeys />);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(useUiStore.getState().commandOpen).toBe(true);
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(useUiStore.getState().commandOpen).toBe(false);
  });
});
