/** Same keys as `T`, every leaf a string: what the Kinyarwanda and French versions of a section must look like. */
export type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

export interface Section<T> {
  en: T;
  rw: Shape<T>;
  fr: Shape<T>;
}

/**
 * Keeps the three languages of one section side by side. English is the source: if Kinyarwanda or
 * French misses a key (or adds a stray one) the compiler says so.
 */
export const defineSection = <T extends Record<string, unknown>>(en: T, rw: Shape<T>, fr: Shape<T>): Section<T> => ({ en, rw, fr });
