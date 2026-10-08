import jul from './samples/camt053_BankZuerichsee_2026-07.xml?raw';
import aug from './samples/camt053_BankZuerichsee_2026-08.xml?raw';
import sep from './samples/camt053_BankZuerichsee_2026-09.xml?raw';
import profiles from './samples/client_profiles.csv?raw';

/** The bundled sample files, exactly as shipped with the exercise. */
export const SAMPLE_FILES: { name: string; text: string }[] = [
  { name: 'camt053_BankZuerichsee_2026-07.xml', text: jul },
  { name: 'camt053_BankZuerichsee_2026-08.xml', text: aug },
  { name: 'camt053_BankZuerichsee_2026-09.xml', text: sep },
  { name: 'client_profiles.csv', text: profiles },
];
