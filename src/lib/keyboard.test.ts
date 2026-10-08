import { renderHook } from '@testing-library/react';
import { keyOf, useHotkeys } from './keyboard';

describe('keyboard', () => {
  it('normalises keys', () => {
    expect(keyOf(new KeyboardEvent('keydown', { key: 'K', metaKey: true }))).toBe('mod+k');
    expect(keyOf(new KeyboardEvent('keydown', { key: 'j' }))).toBe('j');
  });

  it('fires plain keys unless typing in a field', () => {
    const fn = vi.fn();
    const map = { j: fn };
    renderHook(() => useHotkeys(map));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
