import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/components/molecules/ChatMessage';
import { SUGGESTED_QUESTIONS } from '@/domain/triage/followUp';
import { runAction } from '@/lib/notify';
import { askFollowUp } from '@/services/decisions';
import { useCase } from '@/stores/selectors/cases';
import { useUiStore } from '@/stores/useUiStore';

export interface FollowUpChatProps {
  caseId: string;
}

export function FollowUpChat({ caseId }: FollowUpChatProps) {
  const c = useCase(caseId);
  const key = `question:${caseId}`;
  const draft = useUiStore((s) => s.drafts[key] ?? '');
  const setDraft = useUiStore((s) => s.setDraft);
  const clearDraft = useUiStore((s) => s.clearDraft);
  if (!c) return null;
  const ask = async (question: string) => {
    if (await runAction(() => askFollowUp(caseId, question))) clearDraft(key);
  };
  return (
    <Card className="rounded-2xl border-black/5 shadow-none dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-base">Ask Claude</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          {c.conversation.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <Button
              key={q.intent}
              variant="outline"
              size="sm"
              className="h-7 rounded-full text-xs"
              onClick={() => ask(q.label)}
            >
              {q.label}
            </Button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(draft);
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(key, e.target.value)}
            placeholder="Ask a follow-up question"
            aria-label="Follow-up question"
          />
          <Button type="submit" size="icon" aria-label="Ask" disabled={!draft.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
