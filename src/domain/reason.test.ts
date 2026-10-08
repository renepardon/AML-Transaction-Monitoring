import { isValidReason, validateReason } from './reason';

describe('validateReason', () => {
  it('trims and requires ≥ 10 characters', () => {
    expect(validateReason('   documented purchase   ')).toBe('documented purchase');
    expect(() => validateReason('   short    ')).toThrow(/at least 10/);
    expect(isValidReason('0123456789')).toBe(true);
    expect(isValidReason(' 012345678 ')).toBe(false);
  });
});
