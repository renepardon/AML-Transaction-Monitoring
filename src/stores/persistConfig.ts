import { createJSONStorage, type PersistOptions } from 'zustand/middleware';

export const STORAGE_PREFIX = 'aml-poc:';

/** Shared persist options: prefixed key, versioned, JSON in localStorage. */
export function persistOptions<S, P = Partial<S>>(
  name: string,
  version: number,
  extra: Partial<PersistOptions<S, P>> = {},
): PersistOptions<S, P> {
  return {
    name: `${STORAGE_PREFIX}${name}`,
    version,
    storage: createJSONStorage(() => localStorage),
    migrate: (persisted) => persisted as P,
    ...extra,
  };
}

export const devtoolsOptions = (name: string) => ({
  name: `aml-poc/${name}`,
  enabled: import.meta.env.DEV,
});
