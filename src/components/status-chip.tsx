import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-khata-border bg-khata-paperMuted text-khata-muted",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/10 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info",
};

export function StatusChip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 max-w-full items-center truncate rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
