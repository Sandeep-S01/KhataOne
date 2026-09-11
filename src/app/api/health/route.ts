import { NextResponse } from "next/server";

import {
  buildReadinessHealth,
  healthStatusCode,
} from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await buildReadinessHealth();

  return NextResponse.json(
    payload,
    {
      status: healthStatusCode(payload),
    },
  );
}
