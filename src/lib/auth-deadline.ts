export class AuthDeadlineError extends Error {
  constructor() {
    super("Authentication deadline exceeded");
    this.name = "AuthDeadlineError";
  }
}

export async function withAuthDeadline<T>(
  operation: (signal: AbortSignal) => PromiseLike<T>,
  timeoutMs = 5000,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new AuthDeadlineError());
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve().then(() => operation(controller.signal)), deadline]);
  } finally {
    clearTimeout(timer!);
  }
}

export function isInvalidSession(error: { name?: string; status?: number; code?: string }) {
  return error.name === "AuthSessionMissingError" || error.status === 401 || error.status === 403 ||
    ["bad_jwt", "refresh_token_not_found", "refresh_token_already_used", "session_not_found", "session_expired", "user_not_found"].includes(error.code ?? "");
}
