import OpenAI from "openai";

import { getOptionalServerEnv } from "@/lib/env";

const DEFAULT_OPENAI_TIMEOUT_MS = 45_000;
const DEFAULT_OPENAI_MAX_RETRIES = 1;

function configuredInteger(
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const configured = Number(getOptionalServerEnv(key));

  if (!Number.isInteger(configured)) {
    return fallback;
  }

  return Math.min(Math.max(configured, minimum), maximum);
}

export function getExtractionModel() {
  return getOptionalServerEnv("OPENAI_EXTRACTION_MODEL");
}

export function hasOpenAIExtractionConfig() {
  return Boolean(getOptionalServerEnv("OPENAI_API_KEY") && getExtractionModel());
}

export function createOpenAIClient() {
  const apiKey = getOptionalServerEnv("OPENAI_API_KEY");

  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    timeout: configuredInteger(
      "OPENAI_REQUEST_TIMEOUT_MS",
      DEFAULT_OPENAI_TIMEOUT_MS,
      5_000,
      120_000,
    ),
    maxRetries: configuredInteger(
      "OPENAI_MAX_RETRIES",
      DEFAULT_OPENAI_MAX_RETRIES,
      0,
      2,
    ),
  });
}
