import { readFileSync, writeFileSync } from "node:fs";

const input = readFileSync(0, "utf8");
const browserReport = process.argv[3] ? JSON.parse(readFileSync(process.argv[3], "utf8")) : null;
const documentIds = new Set(browserReport?.results.flatMap((result) => result.response_evidence.map((response) => response.request_id)) ?? []);
const browserKinds = new Map((browserReport?.requests ?? [])
  .filter((request) => request.response?.request_id)
  .map((request) => [request.response.request_id, request.kind]));
const spans = new Map();
for (const line of input.split(/\r?\n/)) {
  if (!line.trim().startsWith("{")) continue;
  const record = JSON.parse(line);
  for (const log of record.logs ?? []) {
    if (!log.message?.startsWith("[khataone-perf] ")) continue;
    const span = JSON.parse(log.message.slice("[khataone-perf] ".length));
    if (!/^(middleware|firm_context|dashboard)\.[a-z_.]+$/.test(span.name)) continue;
    const safe = Object.fromEntries([
      "name", "duration_ms", "start_unix_ms", "end_unix_ms", "status", "call",
      "request_id", "request_kind", "region", "runtime",
    ].map((key) => [key, span[key]]));
    if (Number.isInteger(span.metadata?.http_status) && span.metadata.http_status >= 0 && span.metadata.http_status <= 599) {
      safe.http_status = span.metadata.http_status;
    }
    safe.server_reported_request_kind = safe.request_kind;
    const browserKind = browserKinds.get(span.request_id);
    safe.request_kind = browserKind ? `verified_${browserKind === "document" ? "html_navigation" : browserKind}`
      : documentIds.has(span.request_id) ? "verified_html_navigation"
      : span.request_kind === "html_navigation" ? "unverified_navigation" : span.request_kind;
    spans.set(`${span.request_id}:${span.runtime}:${span.call}:${span.name}:${span.start_unix_ms}`, safe);
  }
}
const groups = new Map();
for (const span of spans.values()) {
  const key = `${span.request_kind}:${span.name}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(span);
}
const summary = [...groups].map(([operation, values]) => {
  const durations = values.map((span) => span.duration_ms).sort((a, b) => a - b);
  return { operation, count: values.length, errors: values.filter((span) => span.status !== "ok").length,
    p50_ms: durations[Math.ceil(durations.length * 0.5) - 1],
    p95_ms: durations[Math.ceil(durations.length * 0.95) - 1] };
});
const report = { captured_at: new Date().toISOString(), note: "Logical Auth/Data API elapsed time, not SQL execution time. Filtered request log sample; not all deployment traffic.", summary, spans: [...spans.values()] };
const json = JSON.stringify(report, null, 2);
if (process.argv[2]) writeFileSync(process.argv[2], `${json}\n`);
console.log(JSON.stringify({ unique_spans: spans.size, summary }, null, 2));
