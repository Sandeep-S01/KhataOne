export const startPageCookiePrefix = "khataone_start_page_";

export const startPagePaths = {
  overview: "/dashboard",
  review: "/dashboard/review-queue",
  inbox: "/dashboard/inbox",
} as const;

export type StartPage = keyof typeof startPagePaths;

export function startPageCookieName(userId: string) {
  return `${startPageCookiePrefix}${userId}`;
}

export function parseStartPage(value: unknown): StartPage {
  return value === "review" || value === "inbox" ? value : "overview";
}

export function startPagePath(value: unknown) {
  return startPagePaths[parseStartPage(value)];
}
