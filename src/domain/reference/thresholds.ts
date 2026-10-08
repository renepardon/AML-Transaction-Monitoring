/**
 * Swiss identification thresholds (whole CHF).
 *
 * Sources:
 * - GwV-FINMA (SR 955.033.0) Art. 51 para. 1 lit. b: cash transactions of CHF 15'000 or more,
 *   including several transactions that appear to be connected. VSB 20 is aligned to CHF 15'000.
 * - GwV-FINMA Art. 51 para. 1 lit. a: money exchange of CHF 5'000 or more.
 * - GwV-FINMA Art. 52 para. 2: money or value transfer from abroad of CHF 1'000 or more.
 *   Para. 1: outbound transfers abroad are always identified.
 * - GwV-FINMA Art. 51 para. 3: identify in every case if there are signs of money laundering.
 * - GwV-FINMA Art. 10: payment orders must carry originator and beneficiary data (no amount threshold).
 *
 * On an account, the holder is already identified at onboarding. The thresholds therefore matter
 * as avoidance signals (structuring), not as onboarding triggers. Art. 52 applies to the money
 * transfer business, not to account-based transfers.
 */

/** GwV-FINMA Art. 51 para. 1 lit. b; VSB 20. */
export const CASH_IDENTIFICATION_THRESHOLD_CHF = 15_000;

/** GwV-FINMA Art. 51 para. 1 lit. a. Reference only, not used by rules. */
export const MONEY_EXCHANGE_THRESHOLD_CHF = 5_000;

/** GwV-FINMA Art. 52 para. 2 (money/value transfer from abroad). Reference only. */
export const MONEY_TRANSFER_INBOUND_THRESHOLD_CHF = 1_000;

/** Bank policy: "just below" = 80–99.99 % of the threshold, so CHF 12'000–14'999.99. */
export const STRUCTURING_BAND_RATIO = 0.8;

/** VSB 20 and GwV-FINMA Art. 51 para. 3 on split amounts ("smurfing"). */
export const SMURFING_NOTE =
  'VSB 20: identify if amounts are visibly split to avoid identification ("smurfing"). ' +
  'GwV-FINMA Art. 51 para. 3: identify in every case if there are signs of money laundering.';

export const THRESHOLD_REFERENCES = [
  {
    label: 'Cash identification threshold',
    valueChf: CASH_IDENTIFICATION_THRESHOLD_CHF,
    basis:
      "GwV-FINMA Art. 51 para. 1 lit. b (incl. connected transactions); VSB 20 aligned to CHF 15'000",
  },
  {
    label: 'Money exchange threshold',
    valueChf: MONEY_EXCHANGE_THRESHOLD_CHF,
    basis: 'GwV-FINMA Art. 51 para. 1 lit. a (reference only)',
  },
  {
    label: 'Money transfer from abroad',
    valueChf: MONEY_TRANSFER_INBOUND_THRESHOLD_CHF,
    basis: 'GwV-FINMA Art. 52 para. 2; outbound abroad: identify always (para. 1)',
  },
] as const;
