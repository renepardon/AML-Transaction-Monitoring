import { render, screen } from '@testing-library/react';
import { Timestamp } from './Timestamp';

describe('Timestamp', () => {
  it('renders a machine-readable time element', () => {
    render(<Timestamp iso="2026-10-06T10:15:00.000Z" />);
    expect(screen.getByRole('time')).toHaveAttribute('datetime', '2026-10-06T10:15:00.000Z');
  });
});
