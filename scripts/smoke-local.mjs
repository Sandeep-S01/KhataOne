const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3001";

const checks = [
  { path: "/", expected: [200] },
  { path: "/api/health", expected: [200, 503] },
  { path: "/dashboard", expected: [200, 307, 308] },
  { path: "/dashboard/clients", expected: [200, 307, 308] },
  { path: "/dashboard/review-queue", expected: [200, 307, 308] },
  { path: "/dashboard/ledger", expected: [200, 307, 308] },
  { path: "/dashboard/gst-summary", expected: [200, 307, 308] },
  { path: "/dashboard/reports", expected: [200, 307, 308] },
  { path: "/dashboard/exports", expected: [200, 307, 308] },
  { path: "/dashboard/audit-logs", expected: [200, 307, 308] },
  { path: "/dashboard/operations", expected: [200, 307, 308] },
  { path: "/dashboard/platform", expected: [200, 307, 308] },
  { path: "/dashboard/settings", expected: [200, 307, 308] },
];

let failed = false;

for (const check of checks) {
  const url = new URL(check.path, baseUrl);

  try {
    const response = await fetch(url, {
      redirect: "manual",
    });

    if (!check.expected.includes(response.status)) {
      failed = true;
      console.error(
        `FAIL ${check.path}: expected ${check.expected.join("/")} got ${response.status}`,
      );
      continue;
    }

    console.log(`OK   ${check.path}: ${response.status}`);
  } catch (error) {
    failed = true;
    console.error(
      `FAIL ${check.path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

if (failed) {
  process.exit(1);
}
