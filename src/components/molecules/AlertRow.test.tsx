import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AlertView } from '@/stores/selectors/alerts';
import { AlertRow } from './AlertRow';

const alert: AlertView = {
  id: 'AL-1',
  clientId: 'C1006',
  clientName: 'Sara Huber',
  ruleId: 'R3_PROFILE_DEVIATION',
  severity: 'medium',
  summary: 'Sept 2026: outflow 5.1×',
  status: 'done',
  score: 1,
  explanation: 'Looks explained.',
  recommendedAction: 'close_suggested',
  dismissed: false,
  dismissalReason: null,
  promoted: false,
  raisedAt: '2026-10-06T10:00:00Z',
};

describe('AlertRow', () => {
  it('shows score, rule, summary and explanation with actions', async () => {
    const onDismiss = vi.fn();
    render(
      <ul>
        <AlertRow alert={alert} onDismiss={onDismiss} onPromote={vi.fn()} />
      </ul>,
    );
    expect(screen.getByLabelText('Risk score 1 of 5, Very low')).toBeInTheDocument();
    expect(screen.getByText('Looks explained.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledWith('AL-1');
  });

  it('shows skeletons while triage runs and hides actions', () => {
    render(
      <ul>
        <AlertRow
          alert={{ ...alert, status: 'running', score: null, explanation: null }}
          onDismiss={vi.fn()}
        />
      </ul>,
    );
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('links to the case instead of offering decisions', () => {
    render(
      <ul>
        <AlertRow alert={alert} caseId="CASE-C1006" onOpenCase={vi.fn()} onDismiss={vi.fn()} />
      </ul>,
    );
    expect(screen.getByRole('button', { name: 'Open case' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });
});
