import { StatusChip } from "@/components/status-chip";

export type ModuleRow = {
  primary: string;
  secondary: string;
  status: string;
  statusTone?: "neutral" | "success" | "warning" | "danger" | "info";
  value: string;
};

export function ModulePage({
  eyebrow,
  title,
  description,
  rows,
}: {
  eyebrow: string;
  title: string;
  description: string;
  rows: ModuleRow[];
}) {
  return (
    <div className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-khata-green">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
            {description}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="h-10 rounded-md border border-khata-border bg-white px-3 text-sm font-medium">
            Filter
          </button>
          <button className="h-10 rounded-md bg-khata-green px-3 text-sm font-semibold text-white">
            New
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Work queue</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-khata-paperMuted text-xs text-khata-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Record</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.primary} className="border-t border-khata-border">
                  <td className="px-4 py-3 font-medium">{row.primary}</td>
                  <td className="px-4 py-3 text-khata-muted">
                    {row.secondary}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip tone={row.statusTone}>{row.status}</StatusChip>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
