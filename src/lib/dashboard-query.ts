const postgrestReservedCharacters = /[(),]/g;
const unsupportedSearchCharacters = /[^\p{L}\p{N}\s+#/_-]/gu;
const wildcardCharacters = /[%*]/g;

export function normalizeSearch(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function normalizePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function toPostgrestContainsPattern(value: string) {
  const sanitized = value
    .trim()
    .replace(wildcardCharacters, "")
    .replace(postgrestReservedCharacters, " ")
    .replace(unsupportedSearchCharacters, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);

  return sanitized ? `*${sanitized}*` : null;
}
