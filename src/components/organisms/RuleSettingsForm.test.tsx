import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetAllStores } from '@/test/storeHelpers';
import { useAuditStore } from '@/stores/useAuditStore';
import { useRuleConfigStore } from '@/stores/useRuleConfigStore';
import { RuleSettingsForm } from './RuleSettingsForm';

describe('RuleSettingsForm', () => {
  beforeEach(resetAllStores);

  it('commits a threshold on blur and audits the change', async () => {
    render(<RuleSettingsForm />);
    const input = screen.getByLabelText('Min. deposits');
    await userEvent.clear(input);
    await userEvent.type(input, '4');
    await userEvent.tab();
    expect(useRuleConfigStore.getState().config.structuring.minCount).toBe(4);
    await vi.waitFor(() =>
      expect(useAuditStore.getState().entries.at(-1)).toMatchObject({
        action: 'config.changed',
        reason: 'structuring.minCount: 3 → 4',
      }),
    );
  });

  it('toggles a rule', async () => {
    render(<RuleSettingsForm />);
    await userEvent.click(screen.getAllByRole('checkbox', { name: 'Enabled' })[3]!);
    expect(useRuleConfigStore.getState().enabledRules.R4_RISK_COUNTRY).toBe(false);
  });
});
