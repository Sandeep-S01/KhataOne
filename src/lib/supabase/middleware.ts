import { createServerClient } from "@supabase/ssr";
import type { UserResponse } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv, hasSupabaseConfig } from "@/lib/env";
import { isInvalidSession, withAuthDeadline } from "@/lib/auth-deadline";
import { createPerformanceContext, withServerTiming } from "@/lib/performance";

const protectedRoutes = ["/dashboard", "/onboarding"];
const authRoutes = ["/login", "/signup"];

function isProtectedPath(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isAuthPath(pathname: string) {
  return authRoutes.some((route) => pathname === route);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const trace = createPerformanceContext(request.headers, request.method);
  // Overwrite inbound diagnostic headers; they never influence authorization.
  request.headers.set("x-khataone-perf-id", trace.requestId);
  request.headers.set("x-khataone-perf-sampled", trace.sampled ? "1" : "0");

  if (!isProtectedPath(pathname) && !isAuthPath(pathname)) {
    return NextResponse.next({
      request,
    });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  let authSignal: AbortSignal | undefined;
  let authFinished = false;

  const createAuthClient = () => createServerClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      fetch: async (input, init) => {
        if (authSignal?.aborted) throw new DOMException("Aborted", "AbortError");
        const metadata = { http_status: 0 };
        return withServerTiming("middleware.auth_http_headers", async () => {
          const result = await fetch(input, { ...init, signal: authSignal });
          metadata.http_status = result.status;
          // Record only a status, never the URL, credentials or response payload.
          return { response: result, error: !result.ok };
        }, metadata, trace).then((result) => result.response);
      },
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        if (authFinished || authSignal?.aborted) return;
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const routeClass = isProtectedPath(pathname) ? "protected" : "auth";
  const authStarted = performance.now();
  const unavailable = () => {
    const result = new NextResponse("Authentication is temporarily unavailable. Please retry shortly.", {
      status: 503,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "5",
        "X-Content-Type-Options": "nosniff",
      },
    });
    response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie));
    return result;
  };
  let authResult: UserResponse;
  try {
    authResult = await withServerTiming(
      "middleware.auth_get_user",
      () => withAuthDeadline((signal) => {
        authSignal = signal;
        return createAuthClient().auth.getUser();
      }),
      { route_class: routeClass },
      trace,
    );
  } catch {
    return unavailable();
  } finally {
    authFinished = true;
  }
  if (authResult.error && !isInvalidSession(authResult.error)) return unavailable();
  const user = authResult.error ? null : authResult.data.user;

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (user && isAuthPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (trace.sampled) {
    response.headers.set("x-khataone-perf-id", trace.requestId);
    response.headers.set("Server-Timing", `middleware_auth;dur=${Math.round(performance.now() - authStarted)}`);
  }
  return response;
}
