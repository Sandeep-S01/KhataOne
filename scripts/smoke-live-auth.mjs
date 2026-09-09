import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

import { createServerClient } from "@supabase/ssr";

function loadLocalEnv() {
  try {
    const env = readFileSync(".env.local", "utf8");

    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      process.env[key] ??= valueParts.join("=");
    }
  } catch {
    // CI and production checks can provide environment variables directly.
  }
}

function requireEnv(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function splitSetCookieHeader(value) {
  return value.split(/,(?=\s*[^;,]+=)/g);
}

function applyResponseCookies(response, cookieJar) {
  const headers = response.headers;
  const cookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : splitSetCookieHeader(headers.get("set-cookie") ?? "");

  for (const cookie of cookies) {
    const [pair] = cookie.split(";");
    const separator = pair?.indexOf("=") ?? -1;

    if (separator > 0) {
      cookieJar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1));
    }
  }
}

function cookieHeader(cookieJar) {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function timedFetch(baseUrl, route, cookieJar) {
  const started = performance.now();
  const response = await fetch(new URL(route, baseUrl), {
    headers: {
      Cookie: cookieHeader(cookieJar),
    },
    redirect: "manual",
  });
  await response.text();
  applyResponseCookies(response, cookieJar);

  return {
    route,
    status: response.status,
    location: response.headers.get("location"),
    ms: Math.round(performance.now() - started),
  };
}

loadLocalEnv();

const baseUrl = process.env.SMOKE_BASE_URL ?? "https://khataone.vercel.app";
const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const email = requireEnv("SMOKE_CA_EMAIL");
const password = requireEnv("SMOKE_CA_PASSWORD");
const warnAfterMs = Number(process.env.SMOKE_WARN_AFTER_MS ?? 2000);
const failAfterMs = Number(process.env.SMOKE_FAIL_AFTER_MS ?? 8000);
const cookieJar = new Map();

const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll() {
      return Array.from(cookieJar.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => cookieJar.set(name, value));
    },
  },
});

const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  console.error(`FAIL sign-in: ${error.message}`);
  process.exit(1);
}

const routes = [
  "/dashboard",
  "/dashboard/clients",
  "/dashboard/ledger",
  "/dashboard/review-queue",
  "/dashboard/inbox",
  "/dashboard/gst-summary",
];

let failed = false;

for (const route of routes) {
  const result = await timedFetch(baseUrl, route, cookieJar);
  const isOk = result.status === 200;
  const isSlow = result.ms > failAfterMs;
  const isWarn = result.ms > warnAfterMs;
  const prefix = isOk && !isSlow ? (isWarn ? "WARN" : "OK  ") : "FAIL";
  const redirect = result.location ? ` -> ${result.location}` : "";

  console.log(`${prefix} ${route}: ${result.status} ${result.ms}ms${redirect}`);

  if (!isOk || isSlow) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
