import { render, screen } from '@testing-library/react';
import { SYSTEM_ACTOR } from '@/domain/actors';
import { GENESIS_HASH } from '@/domain/audit/hashChain';
import { useAuditStore } from '@/stores/useAuditStore';
import { ChainStatus } from './ChainStatus';

describe('ChainStatus', () => {
  beforeEach(() =>
    useAuditStore.setState({
      entries: [],
      anchorHash: GENESIS_HASH,
      verification: { status: 'idle' },
    }),
  );

  it('shows "Chain verified" for an intact chain', async () => {
    await useAuditStore
      .getState()
      .append({ action: 'rules.run', entity: { type: 'rules', id: 'x' }, actor: SYSTEM_ACTOR });
    render(<ChainStatus />);
    expect(await screen.findByText('Chain verified · 1 entries')).toBeInTheDocument();
  });

  it('shows where the chain is broken', async () => {
    await useAuditStore
      .getState()
      .append({ action: 'rules.run', entity: { type: 'rules', id: 'x' }, actor: SYSTEM_ACTOR });
    useAuditStore.setState((s) => ({
      entries: s.entries.map((e) => ({ ...e, reason: 'tampered' })),
    }));
    render(<ChainStatus />);
    expect(await screen.findByText('Chain broken at #1')).toBeInTheDocument();
  });
});
