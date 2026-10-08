import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ActorAvatar } from '@/components/atoms/ActorAvatar';
import { Timestamp } from '@/components/atoms/Timestamp';
import { runAction } from '@/lib/notify';
import { addNote } from '@/services/decisions';
import { useCase } from '@/stores/selectors/cases';
import { useUiStore } from '@/stores/useUiStore';

export interface NotesPanelProps {
  caseId: string;
}

export function NotesPanel({ caseId }: NotesPanelProps) {
  const c = useCase(caseId);
  const key = `note:${caseId}`;
  const draft = useUiStore((s) => s.drafts[key] ?? '');
  const setDraft = useUiStore((s) => s.setDraft);
  const clearDraft = useUiStore((s) => s.clearDraft);
  if (!c) return null;
  const submit = async () => {
    if (await runAction(() => addNote(caseId, draft))) clearDraft(key);
  };
  return (
    <Card className="rounded-2xl border-black/5 shadow-none dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-base">Analyst notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {c.notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        <ul className="space-y-3">
          {c.notes.map((n) => (
            <li key={n.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <ActorAvatar actor={n.actor} />
                <Timestamp iso={n.at} />
              </div>
              <p className="text-sm whitespace-pre-line">{n.text}</p>
            </li>
          ))}
        </ul>
        <label htmlFor={`note-${caseId}`} className="sr-only">
          Add a note
        </label>
        <Textarea
          id={`note-${caseId}`}
          value={draft}
          onChange={(e) => setDraft(key, e.target.value)}
          placeholder="Add a finding, a call summary, a document request…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={submit} disabled={!draft.trim()}>
            Add note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
