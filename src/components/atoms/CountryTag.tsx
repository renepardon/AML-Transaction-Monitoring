import { countryRiskTier, COUNTRY_TIER_LABEL } from '@/domain/reference/countryRisk';
import { countryName } from '@/domain/reference/iso';
import { cn } from '@/lib/cn';

export interface CountryTagProps {
  code: string | null;
  expected?: boolean;
  className?: string;
}

export function CountryTag({ code, expected = true, className }: CountryTagProps) {
  if (!code) return <span className="text-muted-foreground">–</span>;
  const tier = countryRiskTier(code);
  const flagged = tier !== 'standard' || !expected;
  const title = `${countryName(code)} · ${COUNTRY_TIER_LABEL[tier]}${expected ? '' : ' · not in expected countries'}`;
  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex items-center rounded px-1 font-mono text-[11px] font-semibold',
        flagged
          ? 'bg-risk-high/12 text-risk-high'
          : 'bg-black/5 text-muted-foreground dark:bg-white/10',
        className,
      )}
    >
      {code}
    </span>
  );
}
