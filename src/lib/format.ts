const indiaTimeZone = "Asia/Kolkata";
const indiaOffsetMinutes = 5 * 60 + 30;

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: indiaTimeZone,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: indiaTimeZone,
});

function formatDateOnlyParts(year: number, month: number, day: number) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function parseDateOnlyParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function parseDateOnly(value: string) {
  const parts = parseDateOnlyParts(value);

  if (!parts) {
    return null;
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return date;
}

export function currentMonthDateRange(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const end = new Date(year, month + 1, 0);

  return {
    start: formatDateOnlyParts(year, month + 1, 1),
    end: formatDateOnlyParts(year, month + 1, end.getDate()),
  };
}

export function auditDateOnlyToIndiaUtcRange(value: string) {
  const parts = parseDateOnlyParts(value);

  if (!parts) {
    return null;
  }

  const startUtcMs =
    Date.UTC(parts.year, parts.month - 1, parts.day) - indiaOffsetMinutes * 60_000;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000 - 1;

  return {
    start: new Date(startUtcMs).toISOString(),
    end: new Date(endUtcMs).toISOString(),
  };
}

export function formatDisplayDate(
  value: string | null | undefined,
  fallback = "Not provided",
) {
  if (!value) {
    return fallback;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseDateOnly(value)
    : new Date(value);

  if (!date) {
    return fallback;
  }

  return Number.isNaN(date.getTime()) ? fallback : dateFormatter.format(date);
}

export function formatDisplayDateTime(
  value: string | null | undefined,
  fallback = "Not available",
) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : dateTimeFormatter.format(date);
}

export function formatDisplayDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  fallback = "Not provided",
) {
  if (!start || !end) {
    return fallback;
  }

  const formattedStart = formatDisplayDate(start, fallback);
  const formattedEnd = formatDisplayDate(end, fallback);

  if (formattedStart === fallback || formattedEnd === fallback) {
    return fallback;
  }

  return `${formattedStart} to ${formattedEnd}`;
}
