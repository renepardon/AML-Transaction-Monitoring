import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AI_ACTOR, SYSTEM_ACTOR } from '@/domain/actors';
import { GENESIS_HASH } from '@/domain/audit/hashChain';
import { useAuditStore } from '@/stores/useAuditStore';
import { resetUi } from '@/test/storeHelpers';
import { AuditLogTable } from './AuditLogTable';

describe('AuditLogTable', () => {
  beforeEach(async () => {
    resetUi();
    useAuditStore.setState({ entries: [], anchorHash: GENESIS_HASH });
    await useAuditStore.getState().append({
      action: 'data.loaded',
      entity: { type: 'dataset', id: 'sample' },
      actor: SYSTEM_ACTOR,
    });
    await useAuditStore.getState().append({
      action: 'triage.completed',
      entity: { type: 'alert', id: 'AL-1' },
      actor: AI_ACTOR,
      reason: 'score 5',
    });
  });

  it('lists entries newest first with actor and reason', () => {
    render(<AuditLogTable />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('triage.completed');
    expect(rows[1]).toHaveTextContent('score 5');
    expect(rows[2]).toHaveTextContent('data.loaded');
  });

  it('filters through the UI store', async () => {
    render(<AuditLogTable />);
    await userEvent.type(screen.getByLabelText('Filter audit log'), 'triage');
    expect(screen.queryByText('data.loaded')).not.toBeInTheDocument();
    expect(screen.getByText('triage.completed')).toBeInTheDocument();
  });

  it('shows an empty state', () => {
    useAuditStore.setState({ entries: [] });
    render(<AuditLogTable />);
    expect(screen.getByText('No audit entries yet.')).toBeInTheDocument();
  });
});
