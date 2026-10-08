import { render, screen } from '@testing-library/react';
import { AI_ACTOR, SEED_ANALYSTS } from '@/domain/actors';
import { ActorAvatar } from './ActorAvatar';

describe('ActorAvatar', () => {
  it('labels the actor kind for screen readers', () => {
    render(<ActorAvatar actor={AI_ACTOR} />);
    expect(screen.getByLabelText('AI')).toBeInTheDocument();
    expect(screen.getByText('Claude (simulated)')).toBeInTheDocument();
  });

  it('can hide the name', () => {
    render(<ActorAvatar actor={SEED_ANALYSTS[0]!} showName={false} />);
    expect(screen.queryByText('A. Keller')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Analyst')).toBeInTheDocument();
  });
});
