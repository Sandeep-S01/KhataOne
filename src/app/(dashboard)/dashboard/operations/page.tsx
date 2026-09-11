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
import {
  runExportGenerationJobNowAction,
  runExtractionJobNowAction,
} from "@/app/actions/operations";
import { getOptionalServerEnv, hasSupabaseConfig } from "@/lib/env";
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

function safeErrorMessage(message: string) {
  return message.length > 140 ? `${message.slice(0, 140)}...` : message;
}

function configuredPositiveInteger(key: string, fallback: number) {
  const value = Number(getOptionalServerEnv(key));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function ageLabel(value: string | null) {
  if (!value) {
    return "-";
  }

  const createdAt = new Date(value).getTime();

  if (Number.isNaN(createdAt)) {
    return "-";
  }

  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));

  if (minutes < 1) {
    return "<1 min";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr`;
  }

  return `${Math.floor(hours / 24)} d`;
}

function ageMinutes(value: string | null) {
  if (!value) {
    return null;
  }

  const createdAt = new Date(value).getTime();

  if (Number.isNaN(createdAt)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
}

function runJobActionFor(job: { job_type: string; status: string }) {
  if (!["queued", "failed"].includes(job.status)) {
    return null;
  }

  if (job.job_type === "ai_extraction") {
    return runExtractionJobNowAction;
  }

  if (job.job_type === "export_generation") {
    return runExportGenerationJobNowAction;
  }

  return null;
}

type JobHealthRow = {
  job_type: string | null;
  status: string | null;
  created_at: string | null;
};

function summarizeJobHealth(rows: JobHealthRow[]) {
  const summaries = new Map<
    string,
    {
      jobType: string;
      active: number;
      failed: number;
      completed: number;
      oldestActive: string | null;
    }
  >();

  for (const row of rows) {
    const jobType = row.job_type ?? "unknown";
    const current =
      summaries.get(jobType) ??
      {
        jobType,
        active: 0,
        failed: 0,
        completed: 0,
        oldestActive: null,
      };

    if (row.status === "queued" || row.status === "processing") {
      current.active += 1;

      if (
        row.created_at &&
        (!current.oldestActive ||
          new Date(row.created_at).getTime() <
            new Date(current.oldestActive).getTime())
      ) {
        current.oldestActive = row.created_at;
      }
    }

    if (row.status === "failed") {
      current.failed += 1;
    }

    if (row.status === "completed") {
      current.completed += 1;
    }

    summaries.set(jobType, current);
  }

  return Array.from(summaries.values()).sort((a, b) =>
    a.jobType.localeCompare(b.jobType),
  );
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
  const oldestQueuedPromise = (async () => {
    const { data } = await supabase
      .from("processing_jobs")
      .select("created_at")
      .eq("firm_id", firm.id)
      .in("status", ["queued", "processing"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return data?.created_at ?? null;
  })().catch(() => null);
  const jobTypesPromise = (async () => {
    const { data } = await supabase
      .from("processing_jobs")
      .select("job_type")
      .eq("firm_id", firm.id)
      .order("job_type");

    return (data ?? []) as Array<{ job_type: string | null }>;
  })().catch(() => [] as Array<{ job_type: string | null }>);
  const jobHealthPromise = (async () => {
    const { data } = await supabase
      .from("processing_jobs")
      .select("job_type, status, created_at")
      .eq("firm_id", firm.id)
      .order("created_at", { ascending: false })
      .limit(1000);

    return (data ?? []) as JobHealthRow[];
  })().catch(() => [] as JobHealthRow[]);

  const [jobsResult, failedCount, queuedCount, oldestQueued, jobTypes, jobHealthRows] =
    await Promise.all([
    jobsPromise,
    failedCountPromise,
    queuedCountPromise,
    oldestQueuedPromise,
    jobTypesPromise,
    jobHealthPromise,
  ]);
  const { data: jobs, error } = jobsResult;
  const staleJobWarningMinutes = configuredPositiveInteger(
    "OPERATIONS_ACTIVE_JOB_WARNING_MINUTES",
    15,
  );
  const jobHealth = summarizeJobHealth(jobHealthRows);
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
        <StatTile
          label="Oldest active job"
          value={ageLabel(oldestQueued)}
          tone="info"
          hint="Queued or processing age"
        />
      </div>

      {jobHealth.length > 0 && (
        <SectionCard
          title="Queue health by job type"
          description={`Active jobs older than ${staleJobWarningMinutes} minutes need operator attention.`}
          bodyClassName="p-0"
        >
          <DataTable minWidth={760} ariaLabel="Queue health by job type">
            <thead className={tableHeaderClass}>
              <tr>
                <th className={tableHeadCellClass}>Job type</th>
                <th className={tableNumericHeadCellClass}>Active</th>
                <th className={tableNumericHeadCellClass}>Failed</th>
                <th className={tableNumericHeadCellClass}>Completed</th>
                <th className={tableHeadCellClass}>Oldest active</th>
                <th className={tableHeadCellClass}>Attention</th>
              </tr>
            </thead>
            <tbody>
              {jobHealth.map((summary) => {
                const oldestMinutes = ageMinutes(summary.oldestActive);
                const isStale =
                  oldestMinutes !== null &&
                  oldestMinutes >= staleJobWarningMinutes;
                const needsAttention = summary.failed > 0 || isStale;

                return (
                  <tr key={summary.jobType} className={tableRowClass}>
                    <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                      {summary.jobType}
                    </td>
                    <td className={tableNumericCellClass}>{summary.active}</td>
                    <td className={tableNumericCellClass}>{summary.failed}</td>
                    <td className={tableNumericCellClass}>{summary.completed}</td>
                    <td className={tableCellClass}>
                      <span className={tableMonoTextClass}>
                        {ageLabel(summary.oldestActive)}
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      {needsAttention ? (
                        <InlineAlert tone={isStale ? "warning" : "danger"}>
                          {isStale
                            ? "Old active job"
                            : "Failed jobs present"}
                        </InlineAlert>
                      ) : (
                        <StatusChip tone="success">clear</StatusChip>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </SectionCard>
      )}

      <FilterBar action="/dashboard/operations" className="md:grid-cols-[1fr_1fr_auto]">
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
            size="sm"
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
          <DataTable minWidth={1080} ariaLabel="Processing jobs">
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
                            {safeErrorMessage(job.last_error)}
                          </InlineAlert>
                        ) : (
                          <span className={tableSecondaryTextClass}>None</span>
                        )}
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        <span>{new Date(job.created_at).toLocaleString("en-IN")}</span>
                        <p className="mt-1 font-mono text-[11px] text-khata-muted">
                          Age {ageLabel(job.created_at)}
                        </p>
                      </td>
                      <td className={tableActionCellClass}>
                        {(() => {
                          const action = canRunExtractionJobs
                            ? runJobActionFor(job)
                            : null;

                          return action ? (
                            <form action={action}>
                              <input type="hidden" name="job_id" value={job.id} />
                              <Button type="submit" variant="outline" size="sm">
                                Run now
                              </Button>
                            </form>
                          ) : (
                            <span className={tableSecondaryTextClass}>-</span>
                          );
                        })()}
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
