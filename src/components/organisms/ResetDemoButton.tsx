import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/useUiStore';

export function ResetDemoButton() {
  const openDialog = useUiStore((s) => s.openDialog);
  return (
    <Button variant="outline" size="sm" onClick={() => openDialog({ kind: 'reset' })}>
      <RotateCcw className="size-4" /> Reset demo
    </Button>
  );
}
