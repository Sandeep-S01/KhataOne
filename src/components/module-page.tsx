import { StatusChip } from "@/components/status-chip";
import {
  Button,
  DataTable,
  PageBody,
  PageHeader,
  SectionCard,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tablePrimaryTextClass,
  tableSecondaryTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tableRowClass,
} from "@/components/design-system";

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
    <div>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" size="sm">Filter</Button>
            <Button size="sm">New</Button>
          </>
        }
      />

      <PageBody>
        <SectionCard title="Work queue" bodyClassName="p-0">
          <DataTable minWidth={720}>
            <thead className={tableHeaderClass}>
              <tr>
                <th className={tableHeadCellClass}>Record</th>
                <th className={tableHeadCellClass}>Detail</th>
                <th className={tableHeadCellClass}>Status</th>
                <th className={tableNumericHeadCellClass}>Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.primary} className={tableRowClass}>
                  <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>{row.primary}</td>
                  <td className={`${tableCellClass} ${tableSecondaryTextClass}`}>
                    {row.secondary}
                  </td>
                  <td className={tableCellClass}>
                    <StatusChip tone={row.statusTone}>{row.status}</StatusChip>
                  </td>
                  <td className={tableNumericCellClass}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </SectionCard>
      </PageBody>
    </div>
  );
}
