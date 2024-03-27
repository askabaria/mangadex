export type ObjectEntries<
  T extends Record<string, unknown>[],
  K extends keyof T[number] = keyof T[number],
  V extends T[number][K] = T[number][K]
> = [K, V][];
