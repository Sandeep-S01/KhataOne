import OpenAI from "openai";

import { getOptionalServerEnv } from "@/lib/env";

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

  return new OpenAI({ apiKey });
}
