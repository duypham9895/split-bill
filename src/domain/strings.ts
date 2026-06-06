/** Trim a string; return undefined when empty, for optional fields. */
export function cleanOptional(value: string): string | undefined {
  const cleaned = value.trim();
  return cleaned || undefined;
}
