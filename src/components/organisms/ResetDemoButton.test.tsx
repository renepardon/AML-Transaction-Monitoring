import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetUi } from '@/test/storeHelpers';
import { useUiStore } from '@/stores/useUiStore';
import { ResetDemoButton } from './ResetDemoButton';

describe('ResetDemoButton', () => {
  it('opens the reset dialog', async () => {
    resetUi();
    render(<ResetDemoButton />);
    await userEvent.click(screen.getByRole('button'));
    expect(useUiStore.getState().dialog).toEqual({ kind: 'reset' });
  });
});
