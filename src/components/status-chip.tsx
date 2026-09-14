import {
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/design-system";

export function StatusChip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: StatusBadgeTone;
}) {
  return (
    <StatusBadge tone={tone} className="min-h-6 capitalize">
      {children}
    </StatusBadge>
  );
}
