import { render, screen } from '@testing-library/react';
import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it('maps statuses to readable labels', () => {
    render(
      <>
        <StatusPill status="closed_false_positive" />
        <StatusPill status="in_review" />
      </>,
    );
    expect(screen.getByText('Closed · false positive')).toBeInTheDocument();
    expect(screen.getByText('In review')).toBeInTheDocument();
  });
});
