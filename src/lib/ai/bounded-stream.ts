export async function readStreamWithByteLimit(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
) {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  let byteSize = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return {
          ok: true as const,
          bytes: Buffer.concat(chunks, byteSize),
        };
      }

      byteSize += value.byteLength;

      if (byteSize > maxBytes) {
        await reader.cancel("Media exceeds configured byte limit.").catch(() => undefined);
        return {
          ok: false as const,
          byteSize,
        };
      }

      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
}
