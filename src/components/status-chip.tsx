import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "bg-khata-paper text-khata-ink",
  success: "bg-green-50 text-khata-green",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-khata-danger",
  info: "bg-blue-50 text-khata-blue",
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
        "inline-flex min-h-6 items-center rounded-md px-2 py-1 text-xs font-medium",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
