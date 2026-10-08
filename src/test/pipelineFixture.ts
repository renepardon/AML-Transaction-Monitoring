import { bootstrap } from '@/services/pipeline';
import { resetAllStores } from './storeHelpers';

/** Resets all stores and runs the full pipeline on the bundled data with instant triage. */
export async function runSamplePipeline(): Promise<void> {
  resetAllStores();
  await bootstrap();
}
