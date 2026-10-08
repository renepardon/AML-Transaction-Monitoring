import { camtXml, TEST_IBAN } from '@/test/builders';
import { buildDataset, checkFile, MAX_FILE_BYTES, sampleSourceInputs, sha256Hex } from './ingest';

const enc = (s: string) => new TextEncoder().encode(s);

describe('ingest', () => {
  it('builds the bundled dataset: 193 tx, 6 clients, all linked and reconciled', async () => {
    const ds = await buildDataset(sampleSourceInputs());
    expect(ds.transactions).toHaveLength(193);
    expect(ds.clients).toHaveLength(6);
    expect(ds.statements).toHaveLength(18);
    expect(ds.transactions.every((t) => t.clientId !== null)).toBe(true);
    expect(ds.report.reconciliation.allOk).toBe(true);
    expect(ds.report.warnings).toEqual([]);
    expect(ds.sources.every((s) => s.status === 'ok' && s.sha256.length === 64)).toBe(true);
  });

  it('enforces the extension allow-list and the 5 MB size limit', () => {
    expect(checkFile({ name: 'a.exe', size: 10 })).toMatch(/Extension/);
    expect(checkFile({ name: 'a.xml', size: MAX_FILE_BYTES + 1 })).toMatch(/5 MB/);
    expect(checkFile({ name: 'a.CSV', size: 10 })).toBeNull();
  });

  it('rejects more than 10 files', async () => {
    const files = Array.from({ length: 11 }, (_, i) => ({ name: `${i}.csv`, bytes: enc('x') }));
    await expect(buildDataset(files)).rejects.toThrow(/At most 10 files/);
  });

  it('collects warnings for bad files instead of crashing', async () => {
    const ds = await buildDataset([
      { name: 'evil.xml', bytes: enc('<!DOCTYPE x><Document/>') },
      { name: 'bin.xml', bytes: new Uint8Array([0xff, 0xfe, 0x00]) },
      { name: 'run.sh', bytes: enc('echo') },
    ]);
    expect(ds.sources.map((s) => s.status)).toEqual(['rejected', 'rejected', 'rejected']);
    expect(ds.report.warnings.map((w) => w.message).join(' | ')).toMatch(
      /DOCTYPE.*UTF-8.*Extension/,
    );
  });

  it('de-duplicates across files and warns about unknown IBANs', async () => {
    const xml = camtXml([
      {
        id: 'X-1',
        iban: TEST_IBAN,
        opening: '0.00',
        closing: '10.00',
        entries: [{ amount: '10.00', ind: 'CRDT', date: '2026-07-01', ref: 'R1' }],
      },
    ]);
    const ds = await buildDataset([
      { name: 'a.xml', bytes: enc(xml) },
      { name: 'b.xml', bytes: enc(xml) },
    ]);
    expect(ds.transactions).toHaveLength(1);
    expect(ds.report.duplicates).toHaveLength(1);
    expect(ds.report.unknownIbans).toEqual([TEST_IBAN]);
  });

  it('hashes with SHA-256', async () => {
    expect(await sha256Hex(enc('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
