import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

function read(path) {
  return readFileSync(path, "utf8");
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function variableHex(source, name) {
  const match = source.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `Missing CSS variable ${name}`);
  return match[1];
}

const globals = read("src/app/globals.css");
const tailwind = read("tailwind.config.ts");
const statusChip = read("src/components/status-chip.tsx");
const designSystem = read("src/components/design-system.tsx");
const dashboardNav = read("src/components/dashboard-nav.tsx");
const authForm = read("src/components/auth-form.tsx");
const passwordReset = read("src/components/password-reset-form.tsx");
const updatePassword = read("src/components/update-password-form.tsx");
const loginPage = read("src/app/(auth)/login/page.tsx");
const signupPage = read("src/app/(auth)/signup/page.tsx");
const forgotPasswordPage = read("src/app/(auth)/forgot-password/page.tsx");
const resetPasswordPage = read("src/app/(auth)/reset-password/page.tsx");
const landingNavigation = read("src/components/landing-navigation.tsx");
const publicPageShell = read("src/components/public-page-shell.tsx");
const landingPage = read("src/app/page.tsx");
const clientForm = read("src/components/client-form.tsx");
const ledgerForm = read("src/components/ledger-entry-form.tsx");
const reviewForm = read("src/components/transaction-review-form.tsx");
const onboardingForm = read("src/components/firm-onboarding-form.tsx");
const packageJson = JSON.parse(read("package.json"));

for (const [name, approximateBackground] of [
  ["success", "#e8f3ed"],
  ["warning", "#f3eee7"],
  ["info", "#e9eff7"],
  ["destructive", "#f7e9e8"],
]) {
  const foreground = variableHex(globals, `--${name}-foreground`);
  assert.ok(
    contrastRatio(foreground, approximateBackground) >= 4.5,
    `${name} foreground must meet 4.5:1 contrast on its tinted feedback surface`,
  );
  assert.match(tailwind, new RegExp(`"${name}-foreground"|${name}-foreground`), `${name} foreground token is available to Tailwind`);
}

assert.match(statusChip, /StatusBadge/, "StatusChip reuses the shared badge recipe");
assert.match(designSystem, /success: "border-success\/30 bg-success\/10 text-success-foreground"/, "success badges use the accessible foreground token");
assert.match(designSystem, /warning: "border-warning\/35 bg-warning\/10 text-warning-foreground"/, "warning badges use the accessible foreground token");
assert.match(designSystem, /danger: "border-destructive\/30 bg-destructive\/10 text-destructive-foreground"/, "danger badges use the accessible foreground token");
assert.match(designSystem, /info: "border-info\/35 bg-info\/10 text-info-foreground"/, "info badges use the accessible foreground token");
assert.match(designSystem, /brand: "border-khata-green\/30 bg-khata-green\/10 text-khata-green"/, "brand badges use the KhataOne theme tokens");
assert.match(designSystem, /role="status"/, "FieldError announces inline validation changes");
assert.match(designSystem, /text-destructive-foreground/, "FieldError and danger feedback use the accessible foreground token");
assert.match(designSystem, /text-success-foreground/, "success feedback uses the accessible foreground token");
assert.match(designSystem, /text-info-foreground/, "info feedback uses the accessible foreground token");
assert.match(designSystem, /text-warning-foreground/, "warning inline alerts use the accessible foreground token");
assert.match(designSystem, /export const authControlClassName = cn\(controlClassName, "bg-transparent"\)/, "auth forms reuse the shared control recipe");
assert.match(designSystem, /export const authSidePanelSurfaceClassName =/, "auth side panels reuse a shared surface recipe");
assert.match(designSystem, /export const publicBrandHomeLinkClassName =/, "public logo links reuse a shared focus/touch recipe");
assert.match(designSystem, /export const authBackLinkClassName =/, "auth back links reuse a shared focus/touch recipe");
assert.match(designSystem, /aria-\[invalid=true\]:border-destructive/, "shared controls expose a visible invalid state");
assert.match(designSystem, /role="alert"/, "query errors use alert semantics");
assert.match(designSystem, /feedbackToneClassName\[tone\]/, "form messages use the shared feedback tone recipe");
assert.match(designSystem, /tone\?: keyof typeof feedbackToneClassName/, "form messages accept every shared feedback tone");
assert.match(designSystem, /role=\{role\}/, "form messages can preserve caller-owned status semantics");

assert.match(dashboardNav, /document\.addEventListener\("keydown", handleKeyDown\)/, "collapsed dashboard tooltip listens for Escape globally while visible");
assert.match(dashboardNav, /event\.key === "Escape"/, "collapsed dashboard tooltip handles Escape");
assert.match(dashboardNav, /setTooltipVisible\(false\)/, "collapsed dashboard tooltip can be dismissed without moving focus");

assert.match(authForm, /authControlClassName/, "login/signup inputs use the shared auth control recipe");
assert.match(authForm, /functionalIconClassName/, "login/signup password visibility icons use the shared icon size");
assert.match(authForm, /functionalIconStrokeWidth/, "login/signup password visibility icons use the shared icon stroke");
assert.doesNotMatch(authForm, /className="size-4"/, "login/signup password visibility icons avoid local size recipes");
assert.match(authForm, /size-11/, "login/signup password toggle uses 44px touch target on mobile");
assert.match(authForm, /pr-12 md:pr-10/, "login/signup password input reserves space for the larger mobile toggle");
assert.match(authForm, /text-destructive-foreground/, "login/signup inline validation uses accessible error foreground");
for (const [label, source] of [
  ["login", loginPage],
  ["signup", signupPage],
  ["forgot-password", forgotPasswordPage],
  ["reset-password", resetPasswordPage],
]) {
  assert.match(source, /publicBrandHomeLinkClassName/, `${label} home logo link uses the shared public link recipe`);
  assert.match(source, /authBackLinkClassName/, `${label} back link uses the shared auth link recipe`);
  assert.match(source, /functionalIconClassName/, `${label} auth page icons use the shared functional icon size`);
  assert.match(source, /functionalIconStrokeWidth/, `${label} auth page icons use the shared functional icon stroke`);
  assert.doesNotMatch(source, /mt-8 rounded-md border border-khata-border bg-white p-4 shadow-sm/, `${label} does not duplicate the auth side-panel surface recipe`);
  assert.doesNotMatch(source, /className="size-4"/, `${label} does not use local icon sizing for auth page icons`);
}
assert.match(loginPage, /authSidePanelSurfaceClassName/, "login side panel uses the shared auth surface recipe");
assert.match(signupPage, /authSidePanelSurfaceClassName/, "signup side panel uses the shared auth surface recipe");
for (const [label, source] of [
  ["landing navigation", landingNavigation],
  ["public page shell", publicPageShell],
  ["landing footer", landingPage],
]) {
  assert.match(source, /publicBrandHomeLinkClassName/, `${label} uses the shared public home-link recipe`);
}
assert.match(passwordReset, /authControlClassName/, "forgot-password email input uses the shared auth control recipe");
assert.match(updatePassword, /authControlClassName/, "update-password inputs use the shared auth control recipe");
assert.match(updatePassword, /feedbackToneClassName/, "update-password feedback uses the shared tone recipe");
assert.match(updatePassword, /functionalIconClassName/, "update-password icons use the shared icon size");
assert.match(updatePassword, /functionalIconStrokeWidth/, "update-password icons use the shared icon stroke");
assert.doesNotMatch(updatePassword, /className="size-4"/, "update-password visibility icons avoid local size recipes");
assert.match(updatePassword, /size-11/, "update-password visibility toggle uses 44px touch target on mobile");
assert.match(updatePassword, /aria-invalid=\{errorField === "password"\}/, "update-password length error is associated with the new-password field");
assert.match(updatePassword, /aria-invalid=\{errorField === "confirm_password"\}/, "update-password mismatch error is associated with the confirm-password field");
assert.match(updatePassword, /id="update-password-error"/, "update-password message has a stable description id");

for (const [name, source, prefix] of [
  ["client", clientForm, "client"],
  ["ledger", ledgerForm, "ledger"],
  ["transaction", reviewForm, "transaction"],
  ["firm", onboardingForm, "firm"],
]) {
  assert.match(source, /const errorId = \(name: string\)/, `${name} form creates stable field error ids`);
  assert.match(source, /aria-invalid=\{Boolean\(/, `${name} form marks invalid fields`);
  assert.match(source, /aria-describedby=\{errorId\(/, `${name} form connects invalid fields to their error messages`);
  assert.match(source, new RegExp(`${prefix}-\\$\\{name\\.replaceAll\\("_", "-"\\)\\}-error`), `${name} form error ids are scoped and stable`);
  assert.match(source, /<FieldError id=\{errorId\(/, `${name} form passes the matching id to FieldError`);
}

assert.equal(packageJson.scripts["test:accessibility-contracts"], "node scripts/test-accessibility-contracts.mjs", "package exposes the R08 accessibility test script");

console.log("Accessibility contract source checks passed.");
