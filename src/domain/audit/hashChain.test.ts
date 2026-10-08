import { SYSTEM_ACTOR } from '../actors';
import { canonicalJson } from './canonicalJson';
import { GENESIS_HASH, hashEntry, verifyChain, type AuditEntry } from './hashChain';

async function chain(n: number): Promise<AuditEntry[]> {
  const out: AuditEntry[] = [];
  let prev = GENESIS_HASH;
  for (let seq = 1; seq <= n; seq++) {
    const draft = {
      seq,
      id: `A${seq}`,
      at: '2026-10-06T10:00:00.000Z',
      actor: SYSTEM_ACTOR,
      action: 'rules.run' as const,
      entity: { type: 'rules' as const, id: 'run' },
      prevHash: prev,
    };
    const hash = await hashEntry(draft);
    out.push({ ...draft, hash });
    prev = hash;
  }
  return out;
}

describe('canonicalJson', () => {
  it('sorts keys and drops undefined', () => {
    expect(canonicalJson({ b: 1, a: { d: undefined, c: [1, 'x'] } })).toBe(
      '{"a":{"c":[1,"x"]},"b":1}',
    );
    expect(canonicalJson({ a: 1, b: 2 })).toBe(canonicalJson({ b: 2, a: 1 }));
  });
});

describe('hash chain', () => {
  it('verifies an intact chain', async () => {
    expect(await verifyChain(await chain(4))).toEqual({ ok: true, count: 4 });
  });

  it('detects a tampered field and reports the first broken seq', async () => {
    const entries = await chain(4);
    entries[2] = { ...entries[2]!, reason: 'inserted later' };
    expect(await verifyChain(entries)).toEqual({ ok: false, brokenSeq: 3, count: 4 });
  });

  it('detects a removed entry', async () => {
    const entries = await chain(4);
    entries.splice(1, 1);
    expect(await verifyChain(entries)).toMatchObject({ ok: false, brokenSeq: 3 });
  });
});
