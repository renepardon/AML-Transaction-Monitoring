import { Briefcase } from 'lucide-react';
import { useCase } from '@/stores/selectors/cases';
import { useUiStore } from '@/stores/useUiStore';
import { AiExplanationCard } from './AiExplanationCard';
import { CaseHeader } from './CaseHeader';
import { DecisionBar } from './DecisionBar';
import { FlowVsProfileChart } from './FlowVsProfileChart';
import { FollowUpChat } from './FollowUpChat';
import { NotesPanel } from './NotesPanel';
import { RuleEvidenceList } from './RuleEvidenceList';
import { TransactionTimeline } from './TransactionTimeline';

export function CaseDetail() {
  const caseId = useUiStore((s) => s.selectedCaseId);
  const c = useCase(caseId);
  if (!c) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-16 text-center text-muted-foreground">
        <Briefcase className="size-8" aria-hidden />
        <p className="text-sm">
          Select a case to see Claude's explanation, the evidence and the decision options.
        </p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 pt-8 lg:px-10">
      <CaseHeader caseId={c.id} />
      <AiExplanationCard caseId={c.id} />
      <RuleEvidenceList caseId={c.id} />
      <FlowVsProfileChart clientId={c.clientId} />
      <TransactionTimeline caseId={c.id} />
      <div className="grid gap-6 xl:grid-cols-2">
        <NotesPanel caseId={c.id} />
        <FollowUpChat caseId={c.id} />
      </div>
      <DecisionBar caseId={c.id} />
    </div>
  );
}
