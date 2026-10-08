import { dataIntegrity } from './dataIntegrity';

describe('R0 data integrity', () => {
  it('produces data warnings for reconciliation, continuity and duplicates', () => {
    const warnings = dataIntegrity({
      reconciliation: {
        allOk: false,
        statements: [
          {
            statementId: 'S1',
            iban: 'X',
            opening: 0,
            closing: 100,
            sumEntries: 0,
            expectedClosing: 0,
            difference: 100,
            ok: false,
          },
        ],
        continuity: [
          {
            iban: 'X',
            fromStatementId: 'S1',
            toStatementId: 'S2',
            previousClosing: 1,
            nextOpening: 2,
            ok: false,
          },
        ],
      },
      duplicates: ['CH00:REF1'],
    });
    expect(warnings.map((w) => w.type)).toEqual(['reconciliation', 'continuity', 'duplicate']);
    expect(warnings[2]?.message).toBe('Duplicate AcctSvcrRef REF1');
  });

  it('is empty for clean data', () => {
    expect(
      dataIntegrity({
        reconciliation: { allOk: true, statements: [], continuity: [] },
        duplicates: [],
      }),
    ).toEqual([]);
  });
});
