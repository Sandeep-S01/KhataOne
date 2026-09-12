import assert from "node:assert/strict";
import { chromium } from "playwright";
import { installRowProbe } from "./dashboard-row-probe.mjs";

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent('<a href="https://example.test/dashboard/ledger">Ledger</a><div role="region" aria-label="Clients"><table><tbody><tr><td>Old row</td></tr></tbody></table></div>');
  await page.evaluate(() => document.addEventListener("click", (event) => event.preventDefault()));
  await page.evaluate(installRowProbe, { href: "/dashboard/ledger", tableName: "Ledger entries" });
  await page.getByRole("link").click();
  assert.equal(await page.evaluate(() => window.__khataoneRowProbe), null);
  await page.evaluate(() => {
    const region = document.querySelector('[role="region"]');
    region.setAttribute("aria-label", "Ledger entries");
    region.setAttribute("aria-busy", "true");
  });
  assert.equal(await page.evaluate(() => window.__khataoneRowProbe), null);
  await page.evaluate(() => {
    const region = document.querySelector('[role="region"]');
    region.removeAttribute("aria-busy");
    region.style.display = "none";
  });
  assert.equal(await page.evaluate(() => window.__khataoneRowProbe), null);
  await page.evaluate(() => { document.querySelector('[role="region"]').style.display = "block"; });
  await page.waitForFunction(() => window.__khataoneRowProbe !== null);
  const observed = await page.evaluate(() => window.__khataoneRowProbe);
  assert.deepEqual(Object.keys(observed).sort(), ["click_to_visible_dom_ms", "click_unix_ms", "visible_dom_unix_ms"]);
  assert.ok(observed.click_to_visible_dom_ms >= 0);
  await page.evaluate(() => { document.querySelector("td").textContent = "PRIVATE changed row"; });
  assert.deepEqual(await page.evaluate(() => window.__khataoneRowProbe), observed, "First observation must remain stable");
  await page.evaluate(installRowProbe, { href: "/dashboard/ledger", tableName: "Ledger entries" });
  assert.equal(await page.evaluate(() => window.__khataoneRowProbe), null, "Reinstall clears previous observation");
  await page.evaluate(() => window.__khataoneStopRowProbe());
} finally {
  await browser.close();
}
console.log("OK visible-row probe rejects source/hidden/busy rows and captures only first numeric observation");
