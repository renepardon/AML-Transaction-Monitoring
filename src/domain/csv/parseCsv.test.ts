import { escapeCsvCell, parseCsv, parseCsvTable, toCsv } from './parseCsv';

describe('parseCsv', () => {
  it('handles quoted commas, escaped quotes, CRLF and LF', () => {
    const rows = parseCsv('a,b,c\r\n1,"x, y","say ""hi"""\n2,,last\n');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', 'x, y', 'say "hi"'],
      ['2', '', 'last'],
    ]);
  });

  it('keeps umlauts and strips a BOM', () => {
    expect(parseCsv('﻿risk\nerhöht')).toEqual([['risk'], ['erhöht']]);
  });

  it('rejects an unterminated quote', () => {
    expect(() => parseCsv('a\n"open')).toThrow(/quoted field/);
  });

  it('validates the header', () => {
    expect(() => parseCsvTable('a,b\n1,2', ['a', 'c'])).toThrow(/missing columns: c/);
    expect(parseCsvTable('a,b\n1,2', ['a', 'b']).records[0]).toEqual({
      line: 2,
      values: { a: '1', b: '2' },
    });
  });

  it('escapes formula injection on export', () => {
    expect(escapeCsvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(escapeCsvCell('-5')).toBe("'-5");
    expect(escapeCsvCell('@cmd')).toBe("'@cmd");
    expect(toCsv([['a,b', '+1']])).toBe('"a,b",\'+1');
  });
});
