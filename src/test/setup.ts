/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { webcrypto } from 'node:crypto';

// jsdom does not always expose SubtleCrypto; fall back to Node's WebCrypto implementation.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

// Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverStub,
    configurable: true,
  });
}

// Radix UI uses pointer capture and scrollIntoView, which jsdom does not implement.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};

// Let background report generations finish before the next test resets the stores.
afterEach(async () => {
  const { waitForDrafts } = await import('@/services/reporting');
  await waitForDrafts();
});

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
