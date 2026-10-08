import { render, screen } from '@testing-library/react';
import { AI_ACTOR, SEED_ANALYSTS } from '@/domain/actors';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage', () => {
  it('labels AI answers', () => {
    render(
      <ChatMessage message={{ id: '1', role: 'ai', text: 'Answer', actor: AI_ACTOR, at: '' }} />,
    );
    expect(screen.getByText(/AI-generated/)).toBeInTheDocument();
  });

  it('does not label analyst questions as AI', () => {
    render(
      <ChatMessage
        message={{ id: '2', role: 'analyst', text: 'Question', actor: SEED_ANALYSTS[0]!, at: '' }}
      />,
    );
    expect(screen.queryByText(/AI-generated/)).not.toBeInTheDocument();
  });
});
