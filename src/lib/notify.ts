import { toast } from 'sonner';
import { isDomainError } from '@/domain/errors';

/** Runs a UI action; domain errors become an error toast instead of crashing. Returns success. */
export async function runAction(
  action: () => Promise<unknown> | unknown,
  success?: string,
): Promise<boolean> {
  try {
    await action();
    if (success) toast.success(success);
    return true;
  } catch (e) {
    toast.error(isDomainError(e) ? e.message : 'Something went wrong');
    if (!isDomainError(e)) console.error(e);
    return false;
  }
}
