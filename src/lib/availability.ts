export type CountReadResult = {
  count: number | null;
  error?: { message?: string } | null;
};

export const unavailableLabel = "Unavailable";

export function countOrUnavailable(result: CountReadResult) {
  return result.error || result.count === null ? null : result.count;
}

export function displayCount(value: number | null) {
  return value === null ? unavailableLabel : value;
}

export function attentionToneForCount(value: number | null) {
  if (value === null) {
    return "danger" as const;
  }

  return value > 0 ? "warning" as const : "neutral" as const;
}

export function positiveToneForCount(value: number | null) {
  if (value === null) {
    return "danger" as const;
  }

  return value > 0 ? "success" as const : "neutral" as const;
}

export function countHint(value: number | null, readyHint: string) {
  return value === null
    ? "Could not load this count. Refresh to retry."
    : readyHint;
}

export function formatNullableCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return unavailableLabel;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNullablePercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return unavailableLabel;
  }

  return `${Math.round(value * 100)}%`;
}
