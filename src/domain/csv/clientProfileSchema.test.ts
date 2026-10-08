import sample from '@/data/samples/client_profiles.csv?raw';
import fixture from '@/test/fixtures/clients.csv?raw';
import crlf from '@/test/fixtures/clients-crlf.csv?raw';
import { parseClientProfiles } from './clientProfileSchema';

describe('parseClientProfiles', () => {
  it('parses the bundled file: 6 clients, umlauts, empty age, quoted country lists', () => {
    const { clients, errors } = parseClientProfiles(sample);
    expect(errors).toEqual([]);
    expect(clients).toHaveLength(6);
    const nordstern = clients.find((c) => c.clientId === 'C1003')!;
    expect(nordstern.age).toBeNull();
    expect(nordstern.riskCategory).toBe('elevated');
    expect(nordstern.riskCategoryLabel).toBe('erhöht');
    expect(nordstern.expectedCountries).toEqual(['CH', 'DE', 'IT']);
    expect(nordstern.occupation).toBe('Handel mit Haushaltswaren, 3 Mitarbeitende');
    expect(nordstern.expectedMonthlyInflow).toBe(5_000_000);
  });

  it('parses LF and CRLF fixtures with escaped quotes', () => {
    expect(parseClientProfiles(fixture).clients).toHaveLength(2);
    const [viktor] = parseClientProfiles(crlf).clients;
    expect(viktor?.name).toBe('Schaller, Viktor');
    expect(viktor?.occupation).toBe('Inhaber "Auto" Handel');
    expect(viktor?.expectedCountries).toEqual(['CH', 'DE']);
  });

  it('reports a row error for a bad numeric value, an unknown country and a bad IBAN', () => {
    const header = fixture.split('\n')[0];
    const bad = `${header}\nC1009,X,Privatperson,Y,40,normal,12k,100,"CH, XX",CH0000000000000000000\n`;
    const { clients, errors } = parseClientProfiles(bad);
    expect(clients).toHaveLength(0);
    expect(errors.map((e) => e.line)).toEqual([2, 2, 2]);
    expect(errors.map((e) => e.message).join(' ')).toMatch(/expected_monthly_inflow_chf/);
    expect(errors.map((e) => e.message).join(' ')).toMatch(/ISO 3166/);
    expect(errors.map((e) => e.message).join(' ')).toMatch(/mod-97/);
  });
});
