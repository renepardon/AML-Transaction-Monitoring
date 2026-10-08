// Stable empty values for selectors, so `?? []` never creates a new reference per render.
export const EMPTY_ARRAY: readonly never[] = Object.freeze([]);
export const EMPTY_OBJECT: Readonly<Record<string, never>> = Object.freeze({});
