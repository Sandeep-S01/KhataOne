import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function load(path, dependencies) {
  const mod = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", code)((id) => {
    assert.ok(id in dependencies, `Unexpected dependency: ${id}`);
    return dependencies[id];
  }, mod, mod.exports);
  return mod.exports;
}

const phone = load("src/lib/whatsapp/phone.ts", {});
assert.equal(phone.normalizeWhatsAppPhone("+91 98765 43210"), "+919876543210");
assert.equal(phone.normalizeWhatsAppPhone("919876543210"), "+919876543210");
assert.equal(phone.normalizeWhatsAppPhone("9876543210"), null);
assert.equal(phone.normalizeWhatsAppPhone("+1 (202) 555-0142"), "+12025550142");
assert.equal(phone.normalizeWhatsAppPhone("+91abc9876543210"), null);
assert.deepEqual(phone.whatsappSenderCandidates("919876543210"), [
  "+919876543210",
  "919876543210",
]);
assert.ok(!phone.whatsappSenderCandidates("919876543210").includes("9876543210"));

const calls = [];
const redirectSignal = new Error("redirected");
const actions = load("src/app/actions/clients.ts", {
  "next/cache": { revalidatePath() {} },
  "next/navigation": { redirect: () => { throw redirectSignal; } },
  "@/lib/env": { hasSupabaseConfig: () => true },
  "@/lib/firms": {
    getFirmContext: async () => ({
      firm: { id: "firm-a", role: "owner" },
      supabase: {
        rpc: async (name, args) => {
          calls.push({ name, args });
          return { data: "client-a", error: null };
        },
      },
    }),
  },
  "@/lib/permissions": { canManageClients: () => true },
  "@/lib/return-context": {
    appendReturnContext: (path) => path,
    clientReturnKeys: [],
    dashboardReturnHref: (path) => path,
    sanitizeReturnContext: () => "",
    withQueryParam: (path) => path,
  },
  "@/lib/whatsapp/phone": phone,
});

function clientForm(number) {
  const form = new FormData();
  form.set("business_name", "Fixture Client");
  form.set("whatsapp_phone", number);
  return form;
}

const rejected = await actions.createClientAction(null, clientForm("9876543210"));
assert.equal(rejected.status, "error");
assert.match(rejected.fieldErrors.whatsapp_phone, /country code/i);
assert.equal(calls.length, 0);

await assert.rejects(
  actions.createClientAction(null, clientForm("+91 98765 43210")),
  (error) => error === redirectSignal,
);
assert.equal(calls[0].name, "create_dashboard_client");
assert.equal(calls[0].args.target_firm_id, "firm-a");
assert.equal(calls[0].args.target_whatsapp_phone, "+919876543210");

const updateForm = clientForm("919876543210");
updateForm.set("client_id", "client-a");
await assert.rejects(
  actions.updateClientAction(null, updateForm),
  (error) => error === redirectSignal,
);
assert.equal(calls[1].name, "update_dashboard_client");
assert.equal(calls[1].args.target_whatsapp_phone, "+919876543210");

console.log("OK client WhatsApp number validation and firm-scoped action mapping");
