import { formatIban, isValidIban, maskIban } from './iban';

describe('iban', () => {
  it('validates with mod-97', () => {
    expect(isValidIban('CH3208146000100100001')).toBe(true);
    expect(isValidIban('CH93 0076 2011 6238 5295 7')).toBe(true);
    expect(isValidIban('CH3308146000100100001')).toBe(false);
    expect(isValidIban('not an iban')).toBe(false);
  });

  it('masks and formats', () => {
    expect(maskIban('CH3208146000100100001')).toBe('CH32 •••• 0001');
    expect(formatIban('CH3208146000100100001')).toBe('CH32 0814 6000 1001 0000 1');
  });
});
