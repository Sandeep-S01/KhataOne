export async function readResponseEvidence(response) {
  const [requestId, vercelId, cacheControl] = await Promise.all([
    response.headerValue("x-khataone-perf-id"),
    response.headerValue("x-vercel-id"),
    response.headerValue("cache-control"),
  ]);
  return {
    status: response.status(),
    request_id: /^[a-f0-9-]{36}$/i.test(requestId ?? "") ? requestId : null,
    vercel_id: /^[a-z0-9:._-]{1,160}$/i.test(vercelId ?? "") ? vercelId : null,
    private_no_store: /(?:^|,)\s*private\s*(?:,|$)/i.test(cacheControl ?? "") &&
      /(?:^|,)\s*no-store\s*(?:,|$)/i.test(cacheControl ?? ""),
  };
}

export function captureResponseEvidence(response, record, pending) {
  if (!record) return;
  const task = readResponseEvidence(response).then((evidence) => {
    record.response = evidence;
  }).catch(() => {
    // Cancellation can make headers unavailable; never persist exception text.
    record.response_evidence_unavailable = true;
  });
  pending.add(task);
  void task.finally(() => pending.delete(task));
}

export function captureRequestTiming(request, record) {
  if (!record) return;
  const timing = request.timing();
  record.network = { start_unix_ms: timing.startTime, request_start_ms: timing.requestStart,
    dns_start_ms: timing.domainLookupStart, dns_end_ms: timing.domainLookupEnd,
    connect_start_ms: timing.connectStart, connect_end_ms: timing.connectEnd,
    tls_start_ms: timing.secureConnectionStart,
    response_start_ms: timing.responseStart, response_end_ms: timing.responseEnd };
}
