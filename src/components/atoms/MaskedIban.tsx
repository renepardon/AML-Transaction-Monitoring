import { maskIban } from '@/lib/format';

export interface MaskedIbanProps {
  iban: string;
  className?: string;
}

export function MaskedIban({ iban, className }: MaskedIbanProps) {
  const masked = maskIban(iban);
  return (
    <span
      className={className ? `font-mono ${className}` : 'font-mono'}
      aria-label={`IBAN ${masked}`}
    >
      {masked}
    </span>
  );
}
