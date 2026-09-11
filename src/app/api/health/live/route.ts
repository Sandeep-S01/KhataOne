import { NextResponse } from "next/server";

import { buildLivenessHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildLivenessHealth());
}
