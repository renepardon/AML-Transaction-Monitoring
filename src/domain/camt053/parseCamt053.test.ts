import jul from '@/data/samples/camt053_BankZuerichsee_2026-07.xml?raw';
import aug from '@/data/samples/camt053_BankZuerichsee_2026-08.xml?raw';
import sep from '@/data/samples/camt053_BankZuerichsee_2026-09.xml?raw';
import { camtXml, TEST_IBAN } from '@/test/builders';
import { parseCamt053 } from './parseCamt053';

const fixture = (amount = '100.50') =>
  camtXml([
    {
      id: 'C1001-202607',
      iban: TEST_IBAN,
      opening: '1000.00',
      closing: '1050.25',
      entries: [
        { amount, ind: 'CRDT', date: '2026-07-01', ref: 'R1' },
        { amount: '50.25', ind: 'DBIT', date: '2026-07-02', ref: 'R2', country: 'DE' },
      ],
    },
  ]);

describe('parseCamt053', () => {
  it('parses the 3 bundled files: 18 statements, 193 entries (60/68/65)', () => {
    const results = [jul, aug, sep].map((x, i) => parseCamt053(x, `f${i}.xml`));
    expect(results.map((r) => r.transactions.length)).toEqual([60, 68, 65]);
    expect(results.flatMap((r) => r.statements)).toHaveLength(18);
    const kinds = new Set(results.flatMap((r) => r.transactions.map((t) => t.kind)));
    expect(kinds).toEqual(new Set(['incoming_transfer', 'outgoing_transfer', 'cash_deposit']));
  });

  it('reads signs, cents and the counterparty by direction', () => {
    const { transactions, statements } = parseCamt053(fixture(), 'f.xml');
    expect(transactions.map((t) => t.signed)).toEqual([10_050, -5_025]);
    expect(transactions[1]?.counterparty.country).toBe('DE');
    expect(statements[0]?.closingBalance).toBe(105_025);
  });

  it('accepts bytes and strips a BOM', () => {
    const bytes = new TextEncoder().encode('﻿' + fixture());
    expect(parseCamt053(bytes, 'f.xml').transactions).toHaveLength(2);
  });

  it('rejects DOCTYPE and ENTITY declarations', () => {
    const xxe = fixture().replace(
      '<Document',
      '<!DOCTYPE d [<!ENTITY x SYSTEM "file:///etc/passwd">]><Document',
    );
    expect(() => parseCamt053(xxe, 'f.xml')).toThrow(/DOCTYPE or ENTITY/);
    expect(() => parseCamt053('<!ENTITY a "b"><Document/>', 'f.xml')).toThrow(/DOCTYPE or ENTITY/);
  });

  it('rejects the wrong namespace and unsupported versions', () => {
    expect(() =>
      parseCamt053(camtXml([], 'urn:iso:std:iso:20022:tech:xsd:camt.052.001.08'), 'f.xml'),
    ).toThrow(/not a camt.053/);
    expect(() =>
      parseCamt053(camtXml([], 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.01'), 'f.xml'),
    ).toThrow(/not a camt.053/);
    expect(
      parseCamt053(camtXml([], 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.12'), 'f.xml')
        .statements,
    ).toEqual([]);
  });

  it('rejects malformed amounts and malformed XML', () => {
    expect(() => parseCamt053(fixture('1,000.00'), 'f.xml')).toThrow(/amount/i);
    expect(() => parseCamt053(fixture('12.345'), 'f.xml')).toThrow(/amount/i);
    expect(() => parseCamt053('<Document><unclosed></Document>', 'f.xml')).toThrow(
      /not well-formed/,
    );
  });

  it('rejects invalid UTF-8', () => {
    const bytes = new Uint8Array([0x3c, 0x44, 0xc3, 0x28, 0x3e]);
    expect(() => parseCamt053(bytes, 'f.xml')).toThrow(/UTF-8/);
  });
});
