import http from "k6/http";
import { check } from "k6";

const baseUrl = __ENV.KHATAONE_AUDIT_BASE_URL;
const allow = __ENV.KHATAONE_AUDIT_ALLOW_NON_PROD === "true";

if (!baseUrl || !allow) {
  throw new Error(
    "Refusing to run. Set KHATAONE_AUDIT_BASE_URL and KHATAONE_AUDIT_ALLOW_NON_PROD=true for an authorized non-production target.",
  );
}

export const options = {
  scenarios: {
    smoke_arrivals: {
      executor: "constant-arrival-rate",
      rate: Number(__ENV.KHATAONE_AUDIT_RATE || 1),
      timeUnit: "1s",
      duration: __ENV.KHATAONE_AUDIT_DURATION || "30s",
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function healthCheck() {
  const response = http.get(`${baseUrl}/api/health`);
  check(response, {
    "health returned expected status": (r) => [200, 503].includes(r.status),
  });
}
