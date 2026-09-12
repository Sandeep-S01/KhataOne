export function register() {
  if (process.env.KHATAONE_PERF_DIAGNOSTICS !== "1") return;
  console.info("[khataone-perf-init]", JSON.stringify({
    instance_id: crypto.randomUUID(),
    initialized_at: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? "local",
    runtime: process.env.NEXT_RUNTIME ?? "unknown",
    deployment: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  }));
}
