import { SYSTEM_ACTOR } from '@/domain/actors';
import type { AuditEntry } from '@/domain/audit/hashChain';
import { auditToCsv, matchesAuditFilter } from './audit';

const entry: AuditEntry = {
  seq: 1,
  id: 'AUD-00001',
  at: '2026-10-06T10:00:00.000Z',
  actor: SYSTEM_ACTOR,
  action: 'case.closed',
  entity: { type: 'case', id: 'CASE-C1006' },
  reason: '=HYPERLINK("x")',
  prevHash: '0',
  hash: 'h',
};

describe('audit selectors', () => {
  it('filters across action, actor, entity and reason', () => {
    expect(matchesAuditFilter(entry, 'c1006')).toBe(true);
    expect(matchesAuditFilter(entry, 'system')).toBe(true);
    expect(matchesAuditFilter(entry, 'escalated')).toBe(false);
  });

  it('exports CSV with formula-injection protection', () => {
    const csv = auditToCsv([entry]);
    expect(csv.split('\r\n')).toHaveLength(2);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
