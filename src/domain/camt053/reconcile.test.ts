import jul from '@/data/samples/camt053_BankZuerichsee_2026-07.xml?raw';
import aug from '@/data/samples/camt053_BankZuerichsee_2026-08.xml?raw';
import sep from '@/data/samples/camt053_BankZuerichsee_2026-09.xml?raw';
import { camtXml, TEST_IBAN } from '@/test/builders';
import { parseCamt053 } from './parseCamt053';
import { dedupeTransactions, reconcile } from './reconcile';

describe('reconcile', () => {
  it('reconciles all 18 bundled statements and the month-to-month continuity', () => {
    const parsed = [jul, aug, sep].map((x, i) => parseCamt053(x, `f${i}.xml`));
    const report = reconcile(
      parsed.flatMap((p) => p.statements),
      parsed.flatMap((p) => p.transactions),
    );
    expect(report.statements).toHaveLength(18);
    expect(report.statements.every((s) => s.ok)).toBe(true);
    expect(report.continuity).toHaveLength(12);
    expect(report.allOk).toBe(true);
  });

  it('fails a tampered statement', () => {
    const xml = camtXml([
      {
        id: 'S1',
        iban: TEST_IBAN,
        opening: '100.00',
        closing: '999.00',
        entries: [{ amount: '10.00', ind: 'CRDT', date: '2026-07-01', ref: 'R1' }],
      },
    ]);
    const { statements, transactions } = parseCamt053(xml, 't.xml');
    const report = reconcile(statements, transactions);
    expect(report.allOk).toBe(false);
    expect(report.statements[0]).toMatchObject({
      ok: false,
      expectedClosing: 11_000,
      difference: 88_900,
    });
  });

  it('de-duplicates by IBAN + AcctSvcrRef', () => {
    const { transactions } = parseCamt053(jul, 'a.xml');
    const result = dedupeTransactions([...transactions, transactions[0]!]);
    expect(result.transactions).toHaveLength(60);
    expect(result.duplicates).toHaveLength(1);
  });
});
