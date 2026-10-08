import { ActorAvatar } from '@/components/atoms/ActorAvatar';
import { AiLabel } from '@/components/atoms/AiLabel';
import { cn } from '@/lib/cn';
import type { ChatMessage as Message } from '@/domain/cases/types';

export interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const ai = message.role === 'ai';
  return (
    <div className={cn('flex gap-2', ai ? '' : 'flex-row-reverse text-right')}>
      <ActorAvatar actor={message.actor} showName={false} />
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
          ai ? 'bg-primary/[0.06]' : 'bg-black/5 dark:bg-white/10',
        )}
      >
        <p className="whitespace-pre-line text-left">{message.text}</p>
        {ai && <AiLabel className="mt-1.5" />}
      </div>
    </div>
  );
}
