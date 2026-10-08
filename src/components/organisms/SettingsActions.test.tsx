import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetAllStores } from '@/test/storeHelpers';
import { useRuleConfigStore } from '@/stores/useRuleConfigStore';
import { SettingsActions } from './SettingsActions';

describe('SettingsActions', () => {
  it('restores default thresholds', async () => {
    resetAllStores();
    useRuleConfigStore.getState().updateRule('structuring', { minCount: 7 });
    render(<SettingsActions />);
    await userEvent.click(screen.getByRole('button', { name: /Reset defaults/ }));
    expect(useRuleConfigStore.getState().config.structuring.minCount).toBe(3);
    expect(screen.getByRole('button', { name: /Re-run detection/ })).toBeInTheDocument();
  });
});
