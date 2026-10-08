import { cn } from '@/lib/cn';
import { riskTone, scoreLabel, TONE_BG } from '@/lib/risk';

export interface RiskScoreBadgeProps {
  score: number;
  className?: string;
}

export function RiskScoreBadge({ score, className }: RiskScoreBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_BG[riskTone(score)],
        className,
      )}
      aria-label={`Risk score ${score} of 5, ${scoreLabel(score)}`}
    >
      <span className="tabular font-semibold">{score}</span>
      <span aria-hidden>· {scoreLabel(score)}</span>
    </span>
  );
}
