/**
 * Country risk lists.
 *
 * IMPORTANT: The FATF lists must be updated after each FATF plenary (February, June, October).
 * State: FATF plenary June 2026.
 */
export const COUNTRY_LISTS_AS_OF = 'June 2026';

/** FATF "High-Risk Jurisdictions subject to a Call for Action" (blacklist), June 2026. */
export const FATF_CALL_FOR_ACTION = ['KP', 'IR', 'MM'] as const;

/** FATF "Jurisdictions under Increased Monitoring" (greylist), June 2026, 22 jurisdictions. */
export const FATF_INCREASED_MONITORING = [
  'AO',
  'BO',
  'BA',
  'BG',
  'CM',
  'CI',
  'CD',
  'HT',
  'IQ',
  'KE',
  'KW',
  'LA',
  'LB',
  'MC',
  'NP',
  'PG',
  'SS',
  'SY',
  'VE',
  'VN',
  'VG',
  'YE',
] as const;

/** Demo bank policy – NOT a FATF list. Labelled "Internal risk list – demo policy" in the UI. */
export const BANK_INTERNAL_ELEVATED = [
  'AE',
  'HK',
  'CY',
  'PA',
  'KY',
  'SC',
  'BS',
  'BZ',
  'MT',
  'LI',
  'EE',
] as const;

export type CountryRiskTier = 'fatf_blacklist' | 'fatf_greylist' | 'internal_elevated' | 'standard';

const has = (list: readonly string[], cc: string) => list.includes(cc.toUpperCase());

export function countryRiskTier(cc: string): CountryRiskTier {
  if (has(FATF_CALL_FOR_ACTION, cc)) return 'fatf_blacklist';
  if (has(FATF_INCREASED_MONITORING, cc)) return 'fatf_greylist';
  if (has(BANK_INTERNAL_ELEVATED, cc)) return 'internal_elevated';
  return 'standard';
}

export const COUNTRY_TIER_LABEL: Record<CountryRiskTier, string> = {
  fatf_blacklist: 'FATF call for action',
  fatf_greylist: 'FATF increased monitoring',
  internal_elevated: 'Internal risk list – demo policy',
  standard: 'Standard',
};
