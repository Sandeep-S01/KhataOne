import { createHmac, timingSafeEqual } from "crypto";

export function verifyMetaSignature({
  rawBody,
  signatureHeader,
  appSecret,
}: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string;
}) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
