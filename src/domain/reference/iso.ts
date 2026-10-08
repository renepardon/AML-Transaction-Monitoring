// ISO 3166-1 alpha-2 country codes (officially assigned).
const ISO_3166_ALPHA2 = new Set(
  (
    'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ ' +
    'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
    'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP ' +
    'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT ' +
    'MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW ' +
    'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG ' +
    'UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
  ).split(' '),
);

export function isIsoCountry(code: string): boolean {
  return ISO_3166_ALPHA2.has(code);
}

const FALLBACK_CURRENCIES = ['CHF', 'EUR', 'USD', 'GBP'];

function supportedCurrencies(): Set<string> {
  try {
    return new Set(Intl.supportedValuesOf('currency'));
  } catch {
    return new Set(FALLBACK_CURRENCIES);
  }
}

const ISO_4217 = supportedCurrencies();

export function isIsoCurrency(code: string): boolean {
  return /^[A-Z]{3}$/.test(code) && ISO_4217.has(code);
}

const COUNTRY_NAMES: Record<string, string> = {
  CH: 'Switzerland',
  DE: 'Germany',
  IT: 'Italy',
  HK: 'Hong Kong',
  AE: 'United Arab Emirates',
  EE: 'Estonia',
  GB: 'United Kingdom',
  LI: 'Liechtenstein',
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

const NEEDS_ARTICLE = new Set(['GB', 'AE', 'US', 'NL', 'PH', 'CZ', 'BS', 'KY', 'VG', 'CD']);

/** Country name for use inside a sentence: "the United Kingdom", "Hong Kong". */
export function countryInSentence(code: string, startOfSentence = false): string {
  const name = countryName(code);
  if (!NEEDS_ARTICLE.has(code)) return name;
  return `${startOfSentence ? 'The' : 'the'} ${name}`;
}
