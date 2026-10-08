import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useAuditStore } from '@/stores/useAuditStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { NotesPanel } from './NotesPanel';

describe('NotesPanel', () => {
  it('adds a note, moves the case to in review and audits it', async () => {
    await runSamplePipeline();
    render(<NotesPanel caseId="CASE-C1001" />);
    await userEvent.type(screen.getByLabelText('Add a note'), 'Called the client, no answer.');
    await userEvent.click(screen.getByRole('button', { name: 'Add note' }));
    expect(await screen.findByText('Called the client, no answer.')).toBeInTheDocument();
    expect(useCaseStore.getState().cases['CASE-C1001']?.status).toBe('in_review');
    expect(useAuditStore.getState().entries.at(-1)?.action).toBe('case.note_added');
  });
});
