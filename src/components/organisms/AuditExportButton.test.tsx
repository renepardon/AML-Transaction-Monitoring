import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SYSTEM_ACTOR } from '@/domain/actors';
import { GENESIS_HASH } from '@/domain/audit/hashChain';
import { useAuditStore } from '@/stores/useAuditStore';
import { AuditExportButton } from './AuditExportButton';

describe('AuditExportButton', () => {
  it('downloads the audit log as CSV', async () => {
    useAuditStore.setState({ entries: [], anchorHash: GENESIS_HASH });
    await useAuditStore
      .getState()
      .append({ action: 'rules.run', entity: { type: 'rules', id: 'x' }, actor: SYSTEM_ACTOR });
    const createObjectURL = vi.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<AuditExportButton />);
    await userEvent.click(screen.getByRole('button', { name: /Export CSV/ }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });
});
