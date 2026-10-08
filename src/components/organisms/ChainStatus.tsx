import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { IntegrityBadge } from '@/components/molecules/IntegrityBadge';
import { useAuditStore } from '@/stores/useAuditStore';

/** Re-verifies the hash chain whenever the log changes and shows the result. */
export function ChainStatus() {
  const entries = useAuditStore((s) => s.entries);
  const verification = useAuditStore((s) => s.verification);
  const verify = useAuditStore((s) => s.verifyChain);
  useEffect(() => {
    void verify();
  }, [entries, verify]);

  if (verification.status !== 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> Verifying chain…
      </span>
    );
  }
  return verification.ok ? (
    <IntegrityBadge ok label={`Chain verified · ${verification.count} entries`} />
  ) : (
    <IntegrityBadge ok={false} label={`Chain broken at #${verification.brokenSeq}`} />
  );
}
