const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toCamelCase = (key: string): string =>
  key.replace(/[_-]([a-z])/g, (_, c: string) => c.toUpperCase());

export const toCamelDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(toCamelDeep);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, val]) => {
    result[toCamelCase(key)] = toCamelDeep(val);
  });
  return result;
};
