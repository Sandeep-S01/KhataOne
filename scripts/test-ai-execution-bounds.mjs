import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const helperSource = readFileSync(
  "src/lib/ai/bounded-stream.ts",
  "utf8",
);
const helperJavaScript = ts.transpileModule(helperSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const helperModule = await import(
  `data:text/javascript;base64,${Buffer.from(helperJavaScript).toString("base64")}`
);
const { readStreamWithByteLimit } = helperModule;

function chunkedStream(chunks, onCancel = () => {}) {
  return new ReadableStream({
    pull(controller) {
      const chunk = chunks.shift();

      if (chunk) {
        controller.enqueue(Uint8Array.from(chunk));
      } else {
        controller.close();
      }
    },
    cancel: onCancel,
  });
}

const withinLimit = await readStreamWithByteLimit(
  chunkedStream([[1, 2], [3, 4]]),
  4,
);
assert.equal(withinLimit.ok, true);
assert.deepEqual([...withinLimit.bytes], [1, 2, 3, 4]);

let cancelled = false;
const overLimit = await readStreamWithByteLimit(
  chunkedStream([[1, 2, 3], [4, 5, 6], [7]], () => {
    cancelled = true;
  }),
  5,
);
assert.deepEqual(overLimit, { ok: false, byteSize: 6 });
assert.equal(cancelled, true);

const mediaSource = readFileSync("src/lib/ai/media-input.ts", "utf8");
assert.match(mediaSource, /MEDIA_DOWNLOAD_TIMEOUT_MS/);
assert.match(mediaSource, /\.download\(document\.storage_path, undefined, \{/);
assert.match(mediaSource, /signal: controller\.signal/);
assert.match(mediaSource, /\.asStream\(\)/);
assert.ok(
  mediaSource.indexOf("if (!isImage && !isPdf && !isAudio)") <
    mediaSource.indexOf("downloadDocumentMedia(document, maxBytes)"),
  "unsupported media must be rejected before private-storage download",
);

const openaiSource = readFileSync("src/lib/ai/openai.ts", "utf8");
assert.match(openaiSource, /OPENAI_REQUEST_TIMEOUT_MS/);
assert.match(openaiSource, /OPENAI_MAX_RETRIES/);
assert.match(openaiSource, /timeout: configuredInteger/);
assert.match(openaiSource, /maxRetries: configuredInteger/);

const schedulerSource = readFileSync(
  ".github/workflows/ai-extraction-scheduler.yml",
  "utf8",
);
assert.match(schedulerSource, /cron: "\*\/5 \* \* \* \*"/);
assert.match(schedulerSource, /secrets\.CRON_SECRET/);
assert.match(
  schedulerSource,
  /api\/jobs\/ai-extraction\/run-queued\?batch_size=10/,
);
assert.match(schedulerSource, /Authorization: Bearer \$\{CRON_SECRET\}/);

console.log(
  "OK AI media streaming cap, cancellation, pre-download validation and provider request bounds",
);
