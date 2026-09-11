const baseUrl = process.env.KHATAONE_AUDIT_BASE_URL;
const allowed = process.env.KHATAONE_AUDIT_ALLOW_NON_PROD === "true";

if (!baseUrl || !allowed) {
  console.error(
    "Refusing to run. Set KHATAONE_AUDIT_BASE_URL and KHATAONE_AUDIT_ALLOW_NON_PROD=true for an authorized non-production target.",
  );
  process.exit(2);
}

const url = new URL(baseUrl);
if (!/(localhost|127\.0\.0\.1|staging|preview|test)/i.test(url.hostname)) {
  console.error(`Refusing target hostname: ${url.hostname}`);
  process.exit(2);
}

const routes = ["/", "/api/health", "/dashboard", "/dashboard/clients"];
let failed = false;

for (const route of routes) {
  const response = await fetch(new URL(route, url), { redirect: "manual" });
  console.log(`${route} ${response.status}`);
  if (![200, 307, 308, 503].includes(response.status)) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
