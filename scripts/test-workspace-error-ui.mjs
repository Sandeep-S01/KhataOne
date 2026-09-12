import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, dependencies = {}) {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => dependencies[name] ?? require(name), loadedModule, loadedModule.exports,
  );
  return loadedModule.exports;
}
const designSystem = load("src/components/design-system.tsx", {
  "@/lib/utils": load("src/lib/utils.ts"),
});
const ErrorView = load("src/app/(dashboard)/error.tsx", { "@/components/design-system": designSystem }).default;
let retries = 0;
const props = { retry: () => retries++, error: new Error("PRIVATE workspace data") };
const tree = ErrorView(props);
function findButton(node) {
  if (!React.isValidElement(node)) return null;
  if (node.type === designSystem.Button) return node;
  return React.Children.toArray(node.props.children).map(findButton).find(Boolean);
}
findButton(tree).props.onClick();
assert.equal(retries, 1);
const html = renderToStaticMarkup(React.createElement(ErrorView, props));
assert.ok(!html.includes("PRIVATE"));
const cssRoot = ".next/static";
const css = readdirSync(cssRoot, { recursive: true }).filter((file) => file.endsWith(".css"))
  .map((file) => readFileSync(path.join(cssRoot, file), "utf8")).join("\n");
assert.ok(css.length > 0, "Run the production build before this visual check");
mkdirSync(".codex-tmp", { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    // Standalone harness has no Next font loader; use explicit system fallbacks.
    await page.setContent(`<html lang="en"><head><style>${css}</style></head><body class="font-sans" style="--font-sans:Arial,sans-serif;--font-display:Arial,sans-serif">${html}</body></html>`);
    await page.getByRole("heading", { name: "Workspace unavailable" }).waitFor();
    const button = page.getByRole("button", { name: "Try again" });
    await button.focus();
    assert.equal(await button.evaluate((el) => el === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const buttonBox = await button.boundingBox();
    assert.ok(buttonBox.height >= 44);
    const headingBox = await page.getByRole("heading").boundingBox();
    assert.ok(headingBox.y + headingBox.height < buttonBox.y);
    await page.screenshot({ path: `.codex-tmp/workspace-error-${width}.png` });
  }
} finally {
  await browser.close();
}
console.log("OK workspace error markup, private error suppression, retry callback and desktop/mobile layout");
