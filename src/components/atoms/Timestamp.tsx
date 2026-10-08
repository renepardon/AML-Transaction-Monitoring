import { formatDateTime } from '@/lib/format';

export interface TimestampProps {
  iso: string;
  className?: string;
}

export function Timestamp({ iso, className }: TimestampProps) {
  return (
    <time dateTime={iso} className={className ? `tabular ${className}` : 'tabular'}>
      {formatDateTime(iso)}
    </time>
  );
}
