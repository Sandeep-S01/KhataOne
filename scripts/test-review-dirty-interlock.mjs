import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

function read(path) {
  return readFileSync(path, "utf8");
}

const reviewForm = read("src/components/transaction-review-form.tsx");
const workspace = read("src/components/transaction-review-workspace.tsx");
const detailPage = read(
  "src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx",
);

assert.match(
  reviewForm,
  /onDirtyChange\?: \(isDirty: boolean\) => void/,
  "TransactionReviewForm should expose a dirty-state callback.",
);
assert.match(
  reviewForm,
  /onChange=\{markDirty\}/,
  "Review field edits should mark the form dirty.",
);
assert.match(
  reviewForm,
  /state\.status === "success"[\s\S]*onDirtyChange\?\.\(false\)/,
  "A successful save state should clear the dirty flag.",
);

assert.match(
  workspace,
  /const \[hasUnsavedChanges, setHasUnsavedChanges\] = useState\(false\)/,
  "The review workspace should own the unsaved-change state.",
);
assert.match(
  workspace,
  /onDirtyChange=\{setHasUnsavedChanges\}/,
  "The review editor should report dirty changes to the workspace.",
);
assert.match(
  workspace,
  /Save review edits before approving, rejecting, marking duplicate, or requesting clarification\./,
  "The dirty-state warning should name the blocked review actions.",
);

const decisionLabels = [
  ["Approve and create ledger handoff", "Approving..."],
  ["Reject", "Rejecting..."],
  ["Mark duplicate", "Marking duplicate..."],
];

assert.match(
  workspace,
  /import \{ useFormStatus \} from "react-dom"/,
  "Review decision controls should use the React form status hook.",
);
assert.match(
  workspace,
  /const disabled = blocked \|\| pending/,
  "Decision controls should be disabled while dirty or while submitting.",
);
assert.match(
  workspace,
  /aria-busy=\{pending\}/,
  "Decision controls should expose pending status.",
);

for (const [label, pendingLabel] of decisionLabels) {
  assert.match(
    workspace,
    new RegExp(`pendingLabel="${pendingLabel.replace("...", "\\.\\.\\.")}"`),
    `${label} should define a pending label.`,
  );
  assert.match(
    workspace,
    new RegExp(`>\\s*${label}`),
    `${label} should keep its idle label.`,
  );
}

assert.match(
  workspace,
  /<Textarea[\s\S]*aria-labelledby=\{clarificationLabelId\}[\s\S]*disabled=\{disabled\}/,
  "Clarification should have a persistent label and disable while dirty or submitting.",
);
assert.match(
  workspace,
  /\{pending \? "Requesting clarification\.\.\." : "Request WhatsApp clarification"\}/,
  "Clarification submit should show pending feedback.",
);
assert.match(
  detailPage,
  /<TransactionReviewWorkspace[\s\S]*reviewError=\{actionError\}[\s\S]*summaryItems=\{summaryItems\}/,
  "The review detail page should render the coordinated review workspace.",
);
assert.doesNotMatch(
  detailPage,
  /action=\{approveTransactionAction\}/,
  "The server detail page should not render an independent approve form.",
);

console.log("Review dirty-state interlock checks passed.");
