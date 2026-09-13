import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

function read(path) {
  return readFileSync(path, "utf8");
}

const pendingButton = read("src/components/pending-submit-button.tsx");
const clientActions = read("src/app/actions/clients.ts");
const clientsPage = read("src/app/(dashboard)/dashboard/clients/page.tsx");
const clientDetailPage = read("src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx");
const operationsActions = read("src/app/actions/operations.ts");
const operationsPage = read("src/app/(dashboard)/dashboard/operations/page.tsx");

assert.match(
  pendingButton,
  /import \{ useFormStatus \} from "react-dom"/,
  "PendingSubmitButton should use React form status.",
);
assert.match(
  pendingButton,
  /disabled=\{pending\}/,
  "PendingSubmitButton should disable while submitting.",
);
assert.match(
  pendingButton,
  /aria-busy=\{pending\}/,
  "PendingSubmitButton should expose busy state.",
);

assert.match(
  clientDetailPage,
  /<PendingSubmitButton[\s\S]*pendingLabel="Archiving\.\.\."[\s\S]*>\s*Archive/,
  "Client archive should use a pending submit button.",
);
assert.match(
  clientActions,
  /const \{ data: archivedClientId, error \} = await supabase\.rpc\("archive_dashboard_client"/,
  "Archive action should inspect the RPC result.",
);
assert.match(
  clientActions,
  /if \(error \|\| typeof archivedClientId !== "string" \|\| !archivedClientId\) \{[\s\S]*redirectWithArchiveResult\("failed", returnContext\)/,
  "Archive action should redirect to a visible failure when the RPC fails.",
);
assert.match(
  clientActions,
  /redirectWithArchiveResult\("success", returnContext\)/,
  "Archive action should redirect to a visible success on completion.",
);
assert.match(
  clientsPage,
  /function archiveResultMessage\(result: string \| undefined\)/,
  "Clients page should map archive result codes to fixed messages.",
);
assert.match(
  clientsPage,
  /<FormMessage[\s\S]*tone=\{archiveMessage\.tone\}[\s\S]*message=\{archiveMessage\.message\}/,
  "Clients page should render archive outcome messages.",
);

assert.match(
  operationsActions,
  /function redirectWithOperationsResult\(result: string, status\?: string\): never/,
  "Operations actions should use an allowlisted result-code redirect helper.",
);
assert.match(
  operationsActions,
  /function manualRunResultCode\(result:/,
  "Operations actions should derive a fixed result code from bounded worker output.",
);
assert.match(
  operationsActions,
  /runAiExtractionJobNow\([\s\S]*\.catch\(\(\) => \(\{[\s\S]*failed: 1/,
  "AI manual run should catch worker exceptions and show a safe failure result.",
);
assert.match(
  operationsActions,
  /runExportGenerationJobNow\([\s\S]*\.catch\(\(\) => \(\{[\s\S]*failed: 1/,
  "Export manual run should catch worker exceptions and show a safe failure result.",
);
assert.doesNotMatch(
  operationsActions,
  /encodeURIComponent\(.*error\.message/,
  "Operations redirects should not place raw worker/provider errors in URLs.",
);
assert.match(
  operationsPage,
  /function operationResultMessage\(result: string\)/,
  "Operations page should map result codes to fixed messages.",
);
assert.match(
  operationsPage,
  /<FormMessage[\s\S]*tone=\{operationMessage\.tone\}[\s\S]*message=\{operationMessage\.message\}/,
  "Operations page should render manual-run outcome messages.",
);
assert.match(
  operationsPage,
  /<PendingSubmitButton[\s\S]*pendingLabel="Running\.\.\."[\s\S]*>\s*Run now/,
  "Operations manual run should use a pending submit button.",
);

console.log("Action outcome feedback checks passed.");
