import { render, screen } from '@testing-library/react';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('renders a keyboard hint', () => {
    render(<Kbd>⌘K</Kbd>);
    expect(screen.getByText('⌘K').tagName).toBe('KBD');
  });
});
