import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { createAdminClient } from "@/lib/supabase/server";

function contentType(path: string) {
  if (path.endsWith(".pdf")) {
    return "application/pdf";
  }

  return "text/csv; charset=utf-8";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const { exportId } = (await params) as { exportId: string };

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required to download exports." },
      { status: 503 },
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  const { firm, supabase } = context;
  const { data: exportRecord, error } = await supabase
    .from("exports")
    .select("id, firm_id, status, storage_path")
    .eq("id", exportId)
    .eq("firm_id", firm.id)
    .single();

  if (error || !exportRecord) {
    return NextResponse.json({ error: "Export not found." }, { status: 404 });
  }

  if (exportRecord.status !== "completed" || !exportRecord.storage_path) {
    return NextResponse.json(
      { error: "Export is not ready for download." },
      { status: 409 },
    );
  }

  const { data: file, error: downloadError } = await admin.storage
    .from("exports")
    .download(exportRecord.storage_path);

  if (downloadError || !file) {
    return NextResponse.json(
      { error: downloadError?.message ?? "Could not download export." },
      { status: 500 },
    );
  }

  const fileName = exportRecord.storage_path.split("/").at(-1) ?? "export.csv";

  return new Response(await file.arrayBuffer(), {
    headers: {
      "content-disposition": `attachment; filename="${fileName}"`,
      "content-type": contentType(fileName),
    },
  });
}
