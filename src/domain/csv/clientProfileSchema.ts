import { z } from 'zod';
import { isValidIban, normalizeIban } from '../iban';
import { isIsoCountry } from '../reference/iso';
import { chf } from '../money';
import type { ClientProfile } from '../types';
import { parseCsvTable } from './parseCsv';

export const CLIENT_PROFILE_COLUMNS = [
  'client_id',
  'name',
  'client_type',
  'occupation_or_business',
  'age',
  'risk_category',
  'expected_monthly_inflow_chf',
  'expected_monthly_outflow_chf',
  'expected_countries',
  'iban',
] as const;

const RISK_MAP: Record<string, 'normal' | 'elevated'> = { normal: 'normal', erhöht: 'elevated' };

const nonNegativeNumber = (label: string) =>
  z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, `${label} must be a non-negative number`)
    .transform(Number);

export const clientProfileRowSchema = z.object({
  client_id: z.string().regex(/^[A-Z0-9-]{2,20}$/, 'client_id is invalid'),
  name: z.string().min(1, 'name is required'),
  client_type: z.string().min(1),
  occupation_or_business: z.string(),
  age: z
    .string()
    .refine((v) => v === '' || /^\d{1,3}$/.test(v), 'age must be empty or a whole number')
    .transform((v) => (v === '' ? null : Number(v))),
  risk_category: z
    .string()
    .refine((v) => v.toLowerCase() in RISK_MAP, 'risk_category must be "normal" or "erhöht"'),
  expected_monthly_inflow_chf: nonNegativeNumber('expected_monthly_inflow_chf'),
  expected_monthly_outflow_chf: nonNegativeNumber('expected_monthly_outflow_chf'),
  expected_countries: z
    .string()
    .transform((v) =>
      v
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
    )
    .refine((list) => list.every(isIsoCountry), 'expected_countries must be ISO 3166-1 alpha-2'),
  iban: z.string().transform(normalizeIban).refine(isValidIban, 'iban fails the mod-97 check'),
});

export interface RowError {
  line: number;
  message: string;
}

export interface ClientProfileParseResult {
  clients: ClientProfile[];
  errors: RowError[];
}

export function parseClientProfiles(text: string): ClientProfileParseResult {
  const table = parseCsvTable(text, CLIENT_PROFILE_COLUMNS);
  const clients: ClientProfile[] = [];
  const errors: RowError[] = [];
  for (const record of table.records) {
    const result = clientProfileRowSchema.safeParse(record.values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ line: record.line, message: `${issue.path.join('.')}: ${issue.message}` });
      }
      continue;
    }
    const r = result.data;
    clients.push({
      clientId: r.client_id,
      name: r.name,
      clientType: r.client_type,
      occupation: r.occupation_or_business,
      age: r.age,
      riskCategory: RISK_MAP[r.risk_category.toLowerCase()] ?? 'normal',
      riskCategoryLabel: r.risk_category,
      expectedMonthlyInflow: chf(r.expected_monthly_inflow_chf),
      expectedMonthlyOutflow: chf(r.expected_monthly_outflow_chf),
      expectedCountries: r.expected_countries,
      iban: r.iban,
    });
  }
  return { clients, errors };
}
