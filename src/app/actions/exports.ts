"use server";

import PDFDocument from "pdfkit";
import { revalidatePath } from "next/cache";

import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm, getCurrentUserId } from "@/lib/firms";
import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

export type ExportActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

type ExportType = "csv_transactions" | "gst_summary" | "pdf_summary";

type TransactionRow = {
  id: string;
  transaction_type: string;
  status: string;
  transaction_date: string | null;
  party_name: string | null;
  party_gstin: string | null;
  invoice_number: string | null;
  category: string | null;
  taxable_amount: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  cess_amount: number | null;
  total_amount: number | null;
};

type GstPeriodRecord = {
  id: string;
  firm_id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  filing_type: string;
  status: string;
  clients:
    | {
        business_name: string | null;
        gstin: string | null;
      }
    | Array<{
        business_name: string | null;
        gstin: string | null;
      }>
    | null;
  gst_summaries:
    | {
        sales_taxable_amount: number | null;
        purchase_taxable_amount: number | null;
        output_cgst: number | null;
        output_sgst: number | null;
        output_igst: number | null;
        input_cgst: number | null;
        input_sgst: number | null;
        input_igst: number | null;
        net_tax_payable: number | null;
        mismatch_count: number | null;
        missing_document_count: number | null;
        generated_at: string | null;
      }
    | Array<{
        sales_taxable_amount: number | null;
        purchase_taxable_amount: number | null;
        output_cgst: number | null;
        output_sgst: number | null;
        output_igst: number | null;
        input_cgst: number | null;
        input_sgst: number | null;
        input_igst: number | null;
        net_tax_payable: number | null;
        mismatch_count: number | null;
        missing_document_count: number | null;
        generated_at: string | null;
      }>
    | null;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  return value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function csvRows(headers: string[], rows: Array<Array<string | number | null>>) {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");
}

function amount(value: number | null | undefined) {
  return Number(value ?? 0);
}

function currency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount(value));
}

function single<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function pdfBuffer(build: (doc: PDFKit.PDFDocument) => void) {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer | Uint8Array) =>
    chunks.push(Buffer.from(chunk)),
  );

  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  build(doc);
  doc.end();

  return finished;
}

async function writeExportAuditLog({
  firmId,
  clientId,
  actorUserId,
  exportId,
  exportType,
  metadata,
}: {
  firmId: string;
  clientId: string | null;
  actorUserId: string | null;
  exportId: string;
  exportType: string;
  metadata: unknown;
}) {
  const supabase = await createClient();

  await supabase.from("audit_logs").insert({
    firm_id: firmId,
    client_id: clientId,
    actor_user_id: actorUserId,
    action: "export.generated",
    entity_type: "export",
    entity_id: exportId,
    after_data: metadata,
    metadata: {
      export_type: exportType,
      direct_gst_filing: false,
    },
  });
}

async function generateTransactionsCsv({
  firmId,
  clientId,
  periodStart,
  periodEnd,
}: {
  firmId: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, transaction_type, status, transaction_date, party_name, party_gstin, invoice_number, category, taxable_amount, cgst_amount, sgst_amount, igst_amount, cess_amount, total_amount",
    )
    .eq("firm_id", firmId)
    .eq("client_id", clientId)
    .eq("status", "approved")
    .gte("transaction_date", periodStart)
    .lte("transaction_date", periodEnd)
    .order("transaction_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const transactions = (data ?? []) as TransactionRow[];

  return {
    body: Buffer.from(
      csvRows(
        [
          "Transaction ID",
          "Date",
          "Type",
          "Party",
          "GSTIN",
          "Invoice",
          "Category",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "Cess",
          "Total",
        ],
        transactions.map((transaction) => [
          transaction.id,
          transaction.transaction_date,
          transaction.transaction_type,
          transaction.party_name,
          transaction.party_gstin,
          transaction.invoice_number,
          transaction.category,
          amount(transaction.taxable_amount),
          amount(transaction.cgst_amount),
          amount(transaction.sgst_amount),
          amount(transaction.igst_amount),
          amount(transaction.cess_amount),
          amount(transaction.total_amount),
        ]),
      ),
      "utf8",
    ),
    fileName: `transactions-${periodStart}-to-${periodEnd}.csv`,
    contentType: "text/csv; charset=utf-8",
    metadata: {
      row_count: transactions.length,
      period_start: periodStart,
      period_end: periodEnd,
    },
  };
}

async function loadGstPeriod(firmId: string, periodId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gst_periods")
    .select("*, clients(business_name, gstin), gst_summaries(*)")
    .eq("id", periodId)
    .eq("firm_id", firmId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "GST period not found.");
  }

  return data as GstPeriodRecord;
}

function gstSummaryCsv(period: GstPeriodRecord) {
  const client = single(period.clients);
  const summary = single(period.gst_summaries);

  if (!summary) {
    throw new Error("Generate the GST summary before exporting it.");
  }

  return Buffer.from(
    csvRows(
      ["Field", "Value"],
      [
        ["Client", client?.business_name ?? "Unknown client"],
        ["GSTIN", client?.gstin ?? ""],
        ["Period start", period.period_start],
        ["Period end", period.period_end],
        ["Filing type", period.filing_type],
        ["Readiness", period.status],
        ["Sales taxable", amount(summary.sales_taxable_amount)],
        ["Purchase taxable", amount(summary.purchase_taxable_amount)],
        ["Output CGST", amount(summary.output_cgst)],
        ["Output SGST", amount(summary.output_sgst)],
        ["Output IGST", amount(summary.output_igst)],
        ["Input CGST", amount(summary.input_cgst)],
        ["Input SGST", amount(summary.input_sgst)],
        ["Input IGST", amount(summary.input_igst)],
        ["Net tax payable", amount(summary.net_tax_payable)],
        ["Mismatches", amount(summary.mismatch_count)],
        ["Missing documents", amount(summary.missing_document_count)],
        ["Generated at", summary.generated_at ?? ""],
        ["Direct GST filing submitted", "No"],
      ],
    ),
    "utf8",
  );
}

async function gstSummaryPdf(period: GstPeriodRecord) {
  const client = single(period.clients);
  const summary = single(period.gst_summaries);

  if (!summary) {
    throw new Error("Generate the GST summary before exporting it.");
  }

  return pdfBuffer((doc) => {
    doc.fontSize(18).text("KhataOne GST Summary", { continued: false });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#5f6b61")
      .text(
        "Review and export preparation only. This document does not confirm GST portal filing or submission.",
      );
    doc.moveDown();
    doc.fillColor("#17201a").fontSize(12);
    doc.text(`Client: ${client?.business_name ?? "Unknown client"}`);
    doc.text(`GSTIN: ${client?.gstin ?? "Pending"}`);
    doc.text(`Period: ${period.period_start} to ${period.period_end}`);
    doc.text(`Filing type: ${period.filing_type}`);
    doc.text(`Readiness: ${period.status.replaceAll("_", " ")}`);
    doc.moveDown();

    const rows = [
      ["Sales taxable", currency(summary.sales_taxable_amount)],
      ["Purchase taxable", currency(summary.purchase_taxable_amount)],
      ["Output CGST", currency(summary.output_cgst)],
      ["Output SGST", currency(summary.output_sgst)],
      ["Output IGST", currency(summary.output_igst)],
      ["Input CGST", currency(summary.input_cgst)],
      ["Input SGST", currency(summary.input_sgst)],
      ["Input IGST", currency(summary.input_igst)],
      ["Net tax payable", currency(summary.net_tax_payable)],
      ["Mismatches", String(summary.mismatch_count ?? 0)],
      ["Missing documents", String(summary.missing_document_count ?? 0)],
    ];

    for (const [label, value] of rows) {
      doc.font("Helvetica-Bold").text(label, { continued: true });
      doc.font("Helvetica").text(`  ${value}`, { align: "right" });
      doc.moveDown(0.25);
    }

    doc.moveDown();
    doc
      .fontSize(9)
      .fillColor("#5f6b61")
      .text(`Generated at: ${new Date().toLocaleString("en-IN")}`);
  });
}

export async function createExportAction(
  _previousState: ExportActionState,
  formData: FormData,
): Promise<ExportActionState> {
  const exportType = readString(formData, "export_type") as ExportType;
  const clientId = readString(formData, "client_id");
  const gstPeriodId = readString(formData, "gst_period_id");
  const periodStart = readString(formData, "period_start");
  const periodEnd = readString(formData, "period_end");
  const fieldErrors: Record<string, string> = {};

  if (!["csv_transactions", "gst_summary", "pdf_summary"].includes(exportType)) {
    fieldErrors.export_type = "Choose a supported export type.";
  }

  if (exportType === "csv_transactions") {
    if (!clientId) {
      fieldErrors.client_id = "Choose a client.";
    }

    if (!validDate(periodStart)) {
      fieldErrors.period_start = "Choose a valid start date.";
    }

    if (!validDate(periodEnd)) {
      fieldErrors.period_end = "Choose a valid end date.";
    }
  }

  if (["gst_summary", "pdf_summary"].includes(exportType) && !gstPeriodId) {
    fieldErrors.gst_period_id = "Choose a generated GST period.";
  }

  if (
    validDate(periodStart) &&
    validDate(periodEnd) &&
    new Date(periodStart) > new Date(periodEnd)
  ) {
    fieldErrors.period_end = "End date must be after start date.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      status: "error",
      message: "Supabase is not configured yet.",
    };
  }

  const admin = createAdminClient();

  if (!admin) {
    return {
      status: "error",
      message: "SUPABASE_SERVICE_ROLE_KEY is required to store exports.",
    };
  }

  const firm = await getActiveFirm();
  const actorUserId = await getCurrentUserId();
  const supabase = await createClient();

  const { data: exportRecord, error: exportError } = await supabase
    .from("exports")
    .insert({
      firm_id: firm!.id,
      client_id: clientId || null,
      gst_period_id: gstPeriodId || null,
      export_type: exportType,
      status: "processing",
      requested_by: actorUserId,
      metadata: {
        requested_period_start: periodStart || null,
        requested_period_end: periodEnd || null,
      },
    })
    .select("id")
    .single();

  if (exportError || !exportRecord) {
    return {
      status: "error",
      message: exportError?.message ?? "Could not create export record.",
    };
  }

  try {
    let generated: {
      body: Buffer;
      fileName: string;
      contentType: string;
      metadata: Record<string, unknown>;
      clientId: string | null;
    };

    if (exportType === "csv_transactions") {
      const csv = await generateTransactionsCsv({
        firmId: firm!.id,
        clientId,
        periodStart,
        periodEnd,
      });

      generated = {
        ...csv,
        clientId,
      };
    } else {
      const period = await loadGstPeriod(firm!.id, gstPeriodId);
      const isPdf = exportType === "pdf_summary";

      generated = {
        body: isPdf ? await gstSummaryPdf(period) : gstSummaryCsv(period),
        fileName: `gst-summary-${period.period_start}-to-${period.period_end}.${isPdf ? "pdf" : "csv"}`,
        contentType: isPdf ? "application/pdf" : "text/csv; charset=utf-8",
        clientId: period.client_id,
        metadata: {
          gst_period_id: period.id,
          period_start: period.period_start,
          period_end: period.period_end,
          readiness: period.status,
        },
      };
    }

    const storagePath = `${firm!.id}/${exportRecord.id}/${generated.fileName}`;
    const { error: uploadError } = await admin.storage
      .from("exports")
      .upload(storagePath, generated.body, {
        contentType: generated.contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: updated, error: updateError } = await supabase
      .from("exports")
      .update({
        client_id: generated.clientId,
        status: "completed",
        storage_path: storagePath,
        completed_at: new Date().toISOString(),
        metadata: generated.metadata,
      })
      .eq("id", exportRecord.id)
      .eq("firm_id", firm!.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Could not finalize export.");
    }

    await writeExportAuditLog({
      firmId: firm!.id,
      clientId: generated.clientId,
      actorUserId,
      exportId: exportRecord.id,
      exportType,
      metadata: updated,
    });

    revalidatePath("/dashboard/exports");
    revalidatePath("/dashboard/reports");

    return {
      status: "success",
      message: "Export generated and stored.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Export generation failed.";

    await supabase
      .from("exports")
      .update({
        status: "failed",
        metadata: {
          error: message,
        },
      })
      .eq("id", exportRecord.id)
      .eq("firm_id", firm!.id);

    revalidatePath("/dashboard/exports");
    revalidatePath("/dashboard/reports");

    return {
      status: "error",
      message,
    };
  }
}
