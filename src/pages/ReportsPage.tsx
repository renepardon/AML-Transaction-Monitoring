import { SplitViewTemplate } from '@/components/templates/SplitViewTemplate';
import { ReportDraftView } from '@/components/organisms/ReportDraftView';
import { ReportList } from '@/components/organisms/ReportList';
import { ReviewDialog } from '@/components/organisms/ReviewDialog';

export function ReportsPage() {
  return (
    <>
      <SplitViewTemplate
        list={<ReportList />}
        detail={<ReportDraftView />}
        listLabel="Report drafts"
        detailLabel="Report detail"
      />
      <ReviewDialog />
    </>
  );
}
