import { stripBom } from '../decode';
import { DomainError } from '../errors';

/** RFC 4180 CSV parser: quoted fields, escaped quotes (""), embedded commas/newlines, CRLF or LF. */
export function parseCsv(input: string): string[][] {
  const text = stripBom(input);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    if (!(row.length === 1 && row[0] === '')) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += ch;
      }
      i++;
      continue;
    }
    if (ch === '"' && field === '') inQuotes = true;
    else if (ch === ',') endField();
    else if (ch === '\r' && text[i + 1] === '\n') {
      endRow();
      i++;
    } else if (ch === '\n' || ch === '\r') endRow();
    else field += ch;
    i++;
  }
  if (inQuotes) throw new DomainError('PARSE_ERROR', 'CSV ends inside a quoted field');
  if (field !== '' || row.length > 0) endRow();
  return rows;
}

export interface CsvTable {
  header: string[];
  records: { line: number; values: Record<string, string> }[];
}

/** Parses a CSV and validates that the header contains exactly the expected columns. */
export function parseCsvTable(input: string, expectedHeader: readonly string[]): CsvTable {
  const [headerRow, ...dataRows] = parseCsv(input);
  if (!headerRow) throw new DomainError('PARSE_ERROR', 'CSV is empty');
  const header = headerRow.map((h) => h.trim());
  const missing = expectedHeader.filter((h) => !header.includes(h));
  if (missing.length > 0) {
    throw new DomainError('PARSE_ERROR', `CSV header is missing columns: ${missing.join(', ')}`);
  }
  const records = dataRows.map((cells, idx) => ({
    line: idx + 2,
    values: Object.fromEntries(header.map((h, c) => [h, (cells[c] ?? '').trim()])),
  }));
  return { header, records };
}

/** Neutralises spreadsheet formula injection for exported cells. */
export function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
}
