import type { Route } from "next";
import { RefreshCw } from "lucide-react";

import {
  ActionLink,
  Button,
  DataTable,
  EmptyState,
  FieldLabel,
  FilterBar,
  InlineAlert,
  PageBody,
  PageHeader,
  QueryError,
  RecordCount,
  SectionCard,
  Select,
  SetupRequired,
  StatTile,
  tableActionCellClass,
  tableActionHeadCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableMonoTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tablePrimaryTextClass,
  tableSecondaryTextClass,
  tableRowClass,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import { runExtractionJobNowAction } from "@/app/actions/operations";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

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
      <SetupRequired message="Connect Supabase environment variables and migrations before monitoring background jobs." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before monitoring background jobs." />
    );
  }

  const { firm, supabase } = context;
  const canRunExtractionJobs = canRunJobs(firm.role);
  let query = supabase
    .from("processing_jobs")
    .select("id, client_id, job_type, entity_type, entity_id, status, attempt_count, last_error, scheduled_at, completed_at, created_at, clients(business_name)")
    .eq("firm_id", firm.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  if (jobType) {
    query = query.eq("job_type", jobType);
  }

  const jobsPromise = (async () => await query)();
  const failedCountPromise = (async () => {
    const { count } = await supabase
      .from("processing_jobs")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firm.id)
      .eq("status", "failed");

    return count;
  })().catch(() => null);
  const queuedCountPromise = (async () => {
    const { count } = await supabase
      .from("processing_jobs")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firm.id)
      .in("status", ["queued", "processing"]);

    return count;
  })().catch(() => null);
  const jobTypesPromise = (async () => {
    const { data } = await supabase
      .from("processing_jobs")
      .select("job_type")
      .eq("firm_id", firm.id)
      .order("job_type");

    return (data ?? []) as Array<{ job_type: string | null }>;
  })().catch(() => [] as Array<{ job_type: string | null }>);

  const [jobsResult, failedCount, queuedCount, jobTypes] = await Promise.all([
    jobsPromise,
    failedCountPromise,
    queuedCountPromise,
    jobTypesPromise,
  ]);
  const { data: jobs, error } = jobsResult;
  const uniqueJobTypes = Array.from(
    new Set(
      jobTypes
        .map((row) => row.job_type)
        .filter((type): type is string => Boolean(type)),
    ),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Job health"
        description="Monitor WhatsApp ingestion, AI extraction, and future background workflows that need follow-up."
        actions={
        <ActionLink
          href={"/dashboard/operations" as Route}
        >
          <RefreshCw className="size-4" />
          Refresh
        </ActionLink>
        }
      />

      <PageBody>
      <div className="grid gap-3 md:grid-cols-2">
        <StatTile label="Queued or processing" value={queuedCount ?? 0} tone="warning" />
        <StatTile label="Failed jobs" value={failedCount ?? 0} tone="danger" />
      </div>

      <FilterBar className="md:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <FieldLabel>
            Status
          </FieldLabel>
          <Select
            name="status"
            defaultValue={status}
            className="mt-1"
          >
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </Select>
        </label>
        <label className="block">
          <FieldLabel>
            Job type
          </FieldLabel>
          <Select
            name="job_type"
            defaultValue={jobType}
            className="mt-1"
          >
            <option value="">All jobs</option>
            {uniqueJobTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Filter
          </Button>
          <ActionLink
            href={"/dashboard/operations" as Route}
          >
            Reset
          </ActionLink>
        </div>
      </FilterBar>

      <SectionCard
        title="Processing jobs"
        actions={<RecordCount value={jobs?.length ?? 0} />}
        bodyClassName="p-0"
      >

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!jobs || jobs.length === 0) && (
          <EmptyState
            title="No jobs found"
            message="Processing jobs will appear after WhatsApp media is queued or AI extraction is requested."
          />
        )}

        {!error && jobs && jobs.length > 0 && (
          <DataTable minWidth={1080}>
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Job</th>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableNumericHeadCellClass}>Attempts</th>
                  <th className={tableHeadCellClass}>Last error</th>
                  <th className={tableNumericHeadCellClass}>Created</th>
                  <th className={tableActionHeadCellClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const client = Array.isArray(job.clients)
                    ? job.clients[0]
                    : job.clients;

                  return (
                    <tr key={job.id} className={tableRowClass}>
                      <td className={tableCellClass}>
                        <span className={tablePrimaryTextClass}>{job.job_type}</span>
                        <p className={`mt-1 ${tableMonoTextClass} text-khata-muted`}>
                          {job.entity_type}:{job.entity_id}
                        </p>
                      </td>
                      <td className={tableCellClass}>
                        {client?.business_name ?? "Not linked"}
                      </td>
                      <td className={tableCellClass}>
                        <StatusChip tone={statusTone(job.status)}>
                          {job.status}
                        </StatusChip>
                      </td>
                      <td className={tableNumericCellClass}>
                        {job.attempt_count ?? 0}
                      </td>
                      <td className={tableCellClass}>
                        {job.last_error ? (
                          <InlineAlert className="max-w-md">
                            {job.last_error}
                          </InlineAlert>
                        ) : (
                          <span className={tableSecondaryTextClass}>None</span>
                        )}
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {new Date(job.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className={tableActionCellClass}>
                        {canRunExtractionJobs &&
                        job.job_type === "ai_extraction" &&
                        ["queued", "failed"].includes(job.status) ? (
                          <form action={runExtractionJobNowAction}>
                            <input type="hidden" name="job_id" value={job.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Run now
                            </Button>
                          </form>
                        ) : (
                          <span className={tableSecondaryTextClass}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
          </DataTable>
        )}
      </SectionCard>
      </PageBody>
    </div>
  );
}
