export function unwrapApiResponse<T>(payload: unknown): T {
  let current: unknown = payload;
  let depth = 0;

  while (
    current &&
    typeof current === 'object' &&
    !Array.isArray(current) &&
    'data' in current &&
    depth < 5
  ) {
    current = (current as { data: unknown }).data;
    depth += 1;
  }

  return current as T;
}
