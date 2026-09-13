import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadUpdatePasswordForm(createClient) {
  const stateWrites = {
    status: [],
    message: [],
    errorField: [],
    pending: [],
    showPassword: [],
  };
  const hookKeys = ["status", "message", "errorField", "pending", "showPassword"];
  let hookIndex = 0;

  const fakeReact = {
    useState(initialValue) {
      const key = hookKeys[hookIndex++];
      return [
        initialValue,
        (nextValue) => {
          stateWrites[key].push(nextValue);
        },
      ];
    },
  };

  const fakeIcons = new Proxy(
    {},
    {
      get: (_target, name) =>
        function Icon(props) {
          return require("react/jsx-runtime").jsx("svg", {
            ...props,
            "data-icon": String(name),
          });
        },
    },
  );

  const loadedModule = { exports: {} };
  const code = ts.transpileModule(
    readFileSync("src/components/update-password-form.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;

  new Function("require", "module", "exports", code)(
    (name) => {
      if (name === "react") {
        return fakeReact;
      }
      if (name === "lucide-react") {
        return fakeIcons;
      }
      if (name === "@/components/design-system") {
        return {
          Button: (props) => require("react/jsx-runtime").jsx("button", props),
        };
      }
      if (name === "@/lib/supabase/client") {
        return { createClient };
      }
      return require(name);
    },
    loadedModule,
    loadedModule.exports,
  );

  hookIndex = 0;
  return {
    tree: loadedModule.exports.UpdatePasswordForm(),
    stateWrites,
  };
}

function createSubmitEvent(fields) {
  let currentTargetReads = 0;
  const form = {
    fields,
    resetCount: 0,
    reset() {
      this.resetCount += 1;
    },
  };

  return {
    form,
    event: {
      prevented: false,
      preventDefault() {
        this.prevented = true;
      },
      get currentTarget() {
        currentTargetReads += 1;
        return currentTargetReads === 1 ? form : null;
      },
    },
    get currentTargetReads() {
      return currentTargetReads;
    },
  };
}

function createDeferred() {
  let resolve;
  const promise = new Promise((settled) => {
    resolve = settled;
  });

  return { promise, resolve };
}

const OriginalFormData = globalThis.FormData;
globalThis.FormData = class FakeFormData {
  constructor(form) {
    assert.ok(form, "FormData should receive the captured form element");
    this.form = form;
  }

  get(name) {
    return this.form.fields[name];
  }
};

try {
  const deferredSuccess = createDeferred();
  const successfulLoad = loadUpdatePasswordForm(() => ({
    auth: {
      updateUser: () => deferredSuccess.promise,
    },
  }));
  const successSubmission = createSubmitEvent({
    password: "new-secure-password",
    confirm_password: "new-secure-password",
  });

  const successPromise = successfulLoad.tree.props.onSubmit(successSubmission.event);
  assert.equal(successSubmission.event.prevented, true);
  assert.deepEqual(successfulLoad.stateWrites.pending, [true]);

  deferredSuccess.resolve({ error: null });
  await successPromise;

  assert.deepEqual(successfulLoad.stateWrites.status, ["idle", "success"]);
  assert.deepEqual(successfulLoad.stateWrites.message, [
    "",
    "Password updated. You can now sign in with the new password.",
  ]);
  assert.deepEqual(successfulLoad.stateWrites.errorField, [null, null]);
  assert.deepEqual(successfulLoad.stateWrites.pending, [true, false]);
  assert.equal(successSubmission.form.resetCount, 1);
  assert.equal(successSubmission.currentTargetReads, 1);

  const rejectedLoad = loadUpdatePasswordForm(() => ({
    auth: {
      updateUser: async () => ({ error: new Error("Recovery link expired") }),
    },
  }));
  const rejectedSubmission = createSubmitEvent({
    password: "new-secure-password",
    confirm_password: "new-secure-password",
  });

  await rejectedLoad.tree.props.onSubmit(rejectedSubmission.event);

  assert.deepEqual(rejectedLoad.stateWrites.status, ["idle", "error"]);
  assert.deepEqual(rejectedLoad.stateWrites.message, [
    "",
    "Recovery link expired",
  ]);
  assert.deepEqual(rejectedLoad.stateWrites.errorField, [null, null]);
  assert.deepEqual(rejectedLoad.stateWrites.pending, [true, false]);
  assert.equal(rejectedSubmission.form.resetCount, 0);
  assert.equal(rejectedSubmission.currentTargetReads, 1);
} finally {
  globalThis.FormData = OriginalFormData;
}

console.log(
  "OK update password async success, provider rejection, form reset and pending cleanup",
);
