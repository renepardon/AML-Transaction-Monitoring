import { SplitViewTemplate } from '@/components/templates/SplitViewTemplate';
import { CaseDetail } from '@/components/organisms/CaseDetail';
import { CaseHotkeys } from '@/components/organisms/CaseHotkeys';
import { CaseList } from '@/components/organisms/CaseList';
import { DecisionDialog } from '@/components/organisms/DecisionDialog';

export function CasesPage() {
  return (
    <>
      <SplitViewTemplate list={<CaseList />} detail={<CaseDetail />} />
      <DecisionDialog />
      <CaseHotkeys />
    </>
  );
}
