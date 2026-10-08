import { escalateCase } from '@/services/decisions';
import { waitForDrafts } from '@/services/reporting';
import { runSamplePipeline } from './pipelineFixture';

/** Full pipeline plus an escalated C1003 with a generated report draft. */
export async function escalatedC1003(): Promise<void> {
  await runSamplePipeline();
  await escalateCase('CASE-C1003', 'pass-through HK → AE twice, no business reason');
  await waitForDrafts();
}
