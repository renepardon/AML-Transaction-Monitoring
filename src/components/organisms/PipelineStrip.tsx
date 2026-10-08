import { PipelineStep } from '@/components/molecules/PipelineStep';
import { usePipelineStages } from '@/stores/selectors/overview';

export function PipelineStrip() {
  const stages = usePipelineStages();
  return (
    <section aria-labelledby="pipeline-title" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pipeline-title" className="text-sm font-semibold">
          Pipeline · 8 stages
        </h2>
        <p className="text-xs text-muted-foreground">
          Rules raise alerts, Claude explains them, a person decides every case.
        </p>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {stages.map((s) => (
          <PipelineStep key={s.index} stage={s} />
        ))}
      </ol>
    </section>
  );
}
