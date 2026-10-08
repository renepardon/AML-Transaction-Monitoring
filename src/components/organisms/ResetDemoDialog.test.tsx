import { render, screen } from '@testing-library/react';
import { resetUi } from '@/test/storeHelpers';
import { useUiStore } from '@/stores/useUiStore';
import { ResetDemoDialog } from './ResetDemoDialog';
import { ResetDemoButton } from './ResetDemoButton';
import userEvent from '@testing-library/user-event';

describe('ResetDemoDialog', () => {
  it('opens from the button and explains the audit behaviour', async () => {
    resetUi();
    render(
      <>
        <ResetDemoButton />
        <ResetDemoDialog />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Reset demo/ }));
    expect(useUiStore.getState().dialog).toEqual({ kind: 'reset' });
    expect(await screen.findByText(/final entry is written to the audit log/)).toBeInTheDocument();
  });
});
