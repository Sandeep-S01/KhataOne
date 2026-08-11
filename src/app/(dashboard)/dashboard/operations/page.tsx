import Link from "next/link";
import type { Route } from "next";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { StatusChip } from "@/components/status-chip";
import { runExtractionJobNowAction } from "@/app/actions/operations";
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "danger";
    case "processing":
    case "queued":
      return "warning";
    default:
      return "neutral";
  }
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function canRunJobs(role: string) {
  return ["owner", "admin", "staff"].includes(role);
}

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = readParam(params.status)?.trim() ?? "";
  const jobType = readParam(params.job_type)?.trim() ?? "";

  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Operations views need Supabase environment variables and migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const canRunExtractionJobs = firm ? canRunJobs(firm.role) : false;
  const supabase = await createClient();
  let query = supabase
    .from("processing_jobs")
    .select("id, client_id, job_type, entity_type, entity_id, status, attempt_count, last_error, scheduled_at, completed_at, created_at, clients(business_name)")
    .eq("firm_id", firm!.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  if (jobType) {
    query = query.eq("job_type", jobType);
  }

  const { data: jobs, error } = await query;
  const { count: failedCount } = await supabase
    .from("processing_jobs")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm!.id)
    .eq("status", "failed");
  const { count: queuedCount } = await supabase
    .from("processing_jobs")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm!.id)
    .in("status", ["queued", "processing"]);
  const { data: jobTypes } = await supabase
    .from("processing_jobs")
    .select("job_type")
    .eq("firm_id", firm!.id)
    .order("job_type");
  const uniqueJobTypes = Array.from(
    new Set((jobTypes ?? []).map((row) => row.job_type).filter(Boolean)),
  );

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-khata-green">
            Operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Job health</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
            Monitor WhatsApp ingestion, AI extraction, and future background
            workflows that need follow-up.
          </p>
        </div>
        <Link
          href={"/dashboard/operations" as Route}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-khata-border bg-white px-4 text-sm font-semibold"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Link>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <section className="rounded-lg border border-khata-border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-khata-muted">
            Queued or processing
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold">
            {queuedCount ?? 0}
          </p>
        </section>
        <section className="rounded-lg border border-khata-border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-khata-muted">
            Failed jobs
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold">
            {failedCount ?? 0}
          </p>
        </section>
      </div>

      <form className="mb-5 grid gap-3 rounded-lg border border-khata-border bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Status
          </span>
          <select
            name="status"
            defaultValue={status}
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          >
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Job type
          </span>
          <select
            name="job_type"
            defaultValue={jobType}
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          >
            <option value="">All jobs</option>
            {uniqueJobTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className="h-10 rounded-md bg-khata-green px-4 text-sm font-semibold text-white">
            Filter
          </button>
          <Link
            href={"/dashboard/operations" as Route}
            className="inline-flex h-10 items-center rounded-md border border-khata-border bg-khata-paper px-4 text-sm font-semibold"
          >
            Reset
          </Link>
        </div>
      </form>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Processing jobs</p>
          <span className="font-mono text-xs text-khata-muted">
            {jobs?.length ?? 0} records
          </span>
        </div>

        {error && (
          <div className="p-4 text-sm text-khata-danger">{error.message}</div>
        )}

        {!error && (!jobs || jobs.length === 0) && (
          <div className="p-6">
            <p className="text-sm font-semibold">No jobs found</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
              Processing jobs will appear after WhatsApp media is queued or AI
              extraction is requested.
            </p>
          </div>
        )}

        {!error && jobs && jobs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Attempts</th>
                  <th className="px-4 py-3 font-medium">Last error</th>
                  <th className="px-4 py-3 text-right font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const client = Array.isArray(job.clients)
                    ? job.clients[0]
                    : job.clients;

                  return (
                    <tr key={job.id} className="border-t border-khata-border">
                      <td className="px-4 py-3">
                        <span className="font-medium">{job.job_type}</span>
                        <p className="mt-1 font-mono text-xs text-khata-muted">
                          {job.entity_type}:{job.entity_id}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {client?.business_name ?? "Not linked"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip tone={statusTone(job.status)}>
                          {job.status}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {job.attempt_count ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {job.last_error ? (
                          <span className="inline-flex max-w-md items-center gap-2 text-khata-danger">
                            <AlertTriangle className="size-4 shrink-0" />
                            <span className="truncate">{job.last_error}</span>
                          </span>
                        ) : (
                          <span className="text-khata-muted">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {new Date(job.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canRunExtractionJobs &&
                        job.job_type === "ai_extraction" &&
                        ["queued", "failed"].includes(job.status) ? (
                          <form action={runExtractionJobNowAction}>
                            <input type="hidden" name="job_id" value={job.id} />
                            <button className="inline-flex h-9 items-center justify-center rounded-md border border-khata-border bg-white px-3 text-xs font-semibold hover:bg-khata-paperMuted">
                              Run now
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-khata-muted">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
