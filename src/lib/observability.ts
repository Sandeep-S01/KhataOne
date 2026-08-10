export function captureOperationalError({
  area,
  error,
  context,
}: {
  area: string;
  error: unknown;
  context?: Record<string, unknown>;
}) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(
    JSON.stringify({
      level: "error",
      area,
      message,
      context: context ?? {},
      captured_at: new Date().toISOString(),
    }),
  );
}
