import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { runAction } from '@/lib/notify';
import { rerunDetection, resetRuleConfig } from '@/services/settings';

export function SettingsActions() {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void runAction(resetRuleConfig, 'Defaults restored')}
      >
        <RotateCcw className="size-4" /> Reset defaults
      </Button>
      <Button size="sm" onClick={() => void runAction(rerunDetection, 'Detection re-run')}>
        <Play className="size-4" /> Re-run detection
      </Button>
    </>
  );
}
