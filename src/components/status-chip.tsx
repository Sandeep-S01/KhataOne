import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-khata-border bg-khata-paperMuted text-khata-muted",
  success: "border-success/35 bg-success/10 text-success-foreground",
  warning: "border-warning/40 bg-warning/10 text-warning-foreground",
  danger: "border-destructive/35 bg-destructive/10 text-destructive-foreground",
  info: "border-info/35 bg-info/10 text-info-foreground",
  brand: "border-khata-green/30 bg-khata-green/10 text-khata-green",
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
