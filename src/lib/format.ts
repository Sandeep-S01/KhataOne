const indiaTimeZone = "Asia/Kolkata";

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

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );

  if (
    date.getUTCFullYear() !== Number(match[1])
    || date.getUTCMonth() !== Number(match[2]) - 1
    || date.getUTCDate() !== Number(match[3])
  ) {
    return null;
  }

  return date;
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
