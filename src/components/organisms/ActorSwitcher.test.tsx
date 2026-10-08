import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetAllStores } from '@/test/storeHelpers';
import { useAuditStore } from '@/stores/useAuditStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { ActorSwitcher } from './ActorSwitcher';

describe('ActorSwitcher', () => {
  beforeEach(resetAllStores);

  it('switches the acting analyst and audits it', async () => {
    render(<ActorSwitcher />);
    await userEvent.click(screen.getByRole('button', { name: /Acting as A. Keller/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /M. Rossi/ }));
    expect(useSessionStore.getState().currentActor.id).toBe('officer-rossi');
    await vi.waitFor(() =>
      expect(useAuditStore.getState().entries.at(-1)?.action).toBe('actor.switched'),
    );
  });
});
