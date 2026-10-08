import { daysBetween } from '../dates';
import { formatChfRounded } from '../money';
import { CONTRACT_PATTERN, SALARY_PATTERN } from '../reference/keywords';
import type { RuleHit } from '../rules/types';
import type { ClientProfile, Transaction } from '../types';

export interface MitigatingFact {
  code:
    | 'salary_payer'
    | 'salary_remittance'
    | 'domestic_contract'
    | 'one_off_below_income'
    | 'countries_expected';
  /** Strong facts explain the activity; supporting facts only add weight to a strong one. */
  strength: 'strong' | 'supporting';
  text: string;
}

/** The transactions that drive the alert: the largest evidence entry for R3, all evidence otherwise. */
export function keyTransactions(hit: RuleHit, txById: Map<string, Transaction>): Transaction[] {
  const evidence = hit.evidenceTxIds
    .map((id) => txById.get(id))
    .filter((t): t is Transaction => !!t);
  if (hit.ruleId !== 'R3_PROFILE_DEVIATION') return evidence;
  const largest = [...evidence].sort((a, b) => b.amount - a.amount)[0];
  return largest ? [largest] : [];
}

export function knownSalaryPayers(transactions: Transaction[]): Set<string> {
  return new Set(
    transactions
      .filter((t) => t.direction === 'CRDT' && /\blohn\b/i.test(t.remittance))
      .map((t) => t.counterparty.name),
  );
}

/** Pure detectors for evidence that makes an alert likely harmless. */
export function detectMitigations(
  hit: RuleHit,
  client: ClientProfile,
  transactions: Transaction[],
): MitigatingFact[] {
  const txById = new Map(transactions.map((t) => [t.id, t]));
  const keys = keyTransactions(hit, txById);
  const payers = knownSalaryPayers(transactions);
  const facts: MitigatingFact[] = [];

  const fromPayer = keys.find((t) => payers.has(t.counterparty.name));
  if (fromPayer) {
    facts.push({
      code: 'salary_payer',
      strength: 'strong',
      text: `${fromPayer.counterparty.name} is the client's known salary payer.`,
    });
  }

  const first = keys[0];
  const salaryNear = first
    ? transactions.find(
        (t) =>
          t.direction === 'CRDT' &&
          SALARY_PATTERN.test(t.remittance) &&
          !/^lohn$/i.test(t.remittance.trim()) &&
          daysBetween(t.bookingDate, first.bookingDate) >= 0 &&
          daysBetween(t.bookingDate, first.bookingDate) <= 30,
      )
    : undefined;
  const salaryInKeys = keys.find((t) => SALARY_PATTERN.test(t.remittance));
  const salaryTx = salaryInKeys ?? salaryNear;
  if (salaryTx) {
    facts.push({
      code: 'salary_remittance',
      strength: 'strong',
      text: `${formatChfRounded(salaryTx.amount)} "${salaryTx.remittance}" from ${salaryTx.counterparty.name} on ${salaryTx.bookingDate}.`,
    });
  }

  const contract = keys.find(
    (t) => t.counterparty.country === 'CH' && CONTRACT_PATTERN.test(t.remittance),
  );
  if (contract) {
    facts.push({
      code: 'domestic_contract',
      strength: 'strong',
      text: `Domestic counterparty ${contract.counterparty.name} with a contract reference ("${contract.remittance}").`,
    });
  }

  if (keys.length === 1 && first && first.kind !== 'cash_deposit') {
    const sameCounterparty = transactions.filter(
      (t) => t.counterparty.name === first.counterparty.name,
    );
    const limit = 6 * client.expectedMonthlyInflow;
    if (
      sameCounterparty.length === 1 &&
      first.amount < limit &&
      client.expectedCountries.includes(first.counterparty.country ?? '')
    ) {
      facts.push({
        code: 'one_off_below_income',
        strength: 'supporting',
        text: `One-off amount of ${formatChfRounded(first.amount)} is below six monthly incomes (${formatChfRounded(limit)}).`,
      });
    }
  }

  const nonCash = keys.filter((t) => t.kind !== 'cash_deposit');
  const countries = [
    ...new Set(nonCash.map((t) => t.counterparty.country).filter((c): c is string => !!c)),
  ];
  if (countries.length > 0 && countries.every((c) => client.expectedCountries.includes(c))) {
    facts.push({
      code: 'countries_expected',
      strength: 'supporting',
      text: `All counterparties are in the expected countries (${client.expectedCountries.join(', ')}).`,
    });
  }
  return facts;
}

/** −1 with strong mitigating evidence, −2 when at least three facts point the same way, 0 otherwise. */
export function mitigationDeduction(facts: MitigatingFact[]): 0 | 1 | 2 {
  const strong = facts.filter((f) => f.strength === 'strong').length;
  if (strong === 0) return 0;
  return facts.length >= 3 ? 2 : 1;
}
