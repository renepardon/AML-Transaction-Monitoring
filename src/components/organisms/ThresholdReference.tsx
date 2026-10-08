import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BANK_INTERNAL_ELEVATED,
  COUNTRY_LISTS_AS_OF,
  FATF_CALL_FOR_ACTION,
  FATF_INCREASED_MONITORING,
} from '@/domain/reference/countryRisk';
import { SMURFING_NOTE, THRESHOLD_REFERENCES } from '@/domain/reference/thresholds';
import { formatChfRounded } from '@/lib/format';

export function ThresholdReference() {
  return (
    <Card className="rounded-2xl border-black/5 shadow-none dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-base">Legal reference</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ul className="space-y-2">
          {THRESHOLD_REFERENCES.map((t) => (
            <li key={t.label}>
              <span className="font-medium">
                {t.label}: {formatChfRounded(t.valueChf * 100)}
              </span>
              <span className="block text-xs text-muted-foreground">{t.basis}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          {SMURFING_NOTE} Account holders are identified at onboarding, so on an account the
          thresholds act as avoidance signals (structuring).
        </p>
        <div className="space-y-1 text-xs">
          <p className="font-medium">
            Country lists (as of {COUNTRY_LISTS_AS_OF}, update after each FATF plenary)
          </p>
          <p>
            <span className="text-muted-foreground">FATF call for action:</span>{' '}
            {FATF_CALL_FOR_ACTION.join(', ')}
          </p>
          <p>
            <span className="text-muted-foreground">FATF increased monitoring:</span>{' '}
            {FATF_INCREASED_MONITORING.join(', ')}
          </p>
          <p>
            <span className="text-muted-foreground">
              Internal risk list – demo policy (not FATF):
            </span>{' '}
            {BANK_INTERNAL_ELEVATED.join(', ')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
