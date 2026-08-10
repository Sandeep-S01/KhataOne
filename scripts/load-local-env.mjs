import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadLocalEnv(fileName = ".env.local") {
  const envPath = resolve(process.cwd(), fileName);

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
