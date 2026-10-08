import { countryRiskTier, FATF_INCREASED_MONITORING } from './countryRisk';
import { matchKeywords, PURPOSE_KEYWORDS } from './keywords';
import { CASH_IDENTIFICATION_THRESHOLD_CHF, STRUCTURING_BAND_RATIO } from './thresholds';

describe('reference data', () => {
  it('classifies country risk tiers without claiming HK/AE/EE are FATF-listed', () => {
    expect(countryRiskTier('IR')).toBe('fatf_blacklist');
    expect(countryRiskTier('ve')).toBe('fatf_greylist');
    expect(countryRiskTier('HK')).toBe('internal_elevated');
    expect(countryRiskTier('AE')).toBe('internal_elevated');
    expect(countryRiskTier('EE')).toBe('internal_elevated');
    expect(countryRiskTier('GB')).toBe('standard');
    expect(countryRiskTier('CH')).toBe('standard');
    expect(FATF_INCREASED_MONITORING).toHaveLength(22);
  });

  it('defines the structuring band as CHF 12’000–14’999.99', () => {
    expect(CASH_IDENTIFICATION_THRESHOLD_CHF * STRUCTURING_BAND_RATIO).toBe(12_000);
  });

  it('matches keywords case-insensitively, including umlauts', () => {
    expect(matchKeywords('Übertrag', PURPOSE_KEYWORDS)).toEqual(['übertrag']);
    expect(matchKeywords('CryptoNova Exchange OU', PURPOSE_KEYWORDS)).toEqual([
      'crypto',
      'exchange',
    ]);
    expect(matchKeywords('Warenlieferung', PURPOSE_KEYWORDS)).toEqual([]);
  });
});
