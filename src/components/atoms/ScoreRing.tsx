import { cn } from '@/lib/cn';
import { riskTone, scoreLabel, TONE_TEXT } from '@/lib/risk';

export interface ScoreRingProps {
  score: number | null;
  size?: number;
  className?: string;
}

export function ScoreRing({ score, size = 40, className }: ScoreRingProps) {
  const stroke = Math.max(3, size / 12);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = score ? score / 5 : 0;
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        score ? TONE_TEXT[riskTone(score)] : 'text-muted-foreground',
        className,
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={score ? `Risk score ${score} of 5, ${scoreLabel(score)}` : 'Not scored yet'}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="transition-[stroke-dashoffset] duration-200 ease-out"
        />
      </svg>
      <span className="tabular absolute text-sm font-semibold" style={{ fontSize: size / 2.8 }}>
        {score ?? '–'}
      </span>
    </span>
  );
}
