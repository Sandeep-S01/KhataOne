import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ClipboardList, Info, LockKeyhole } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "outline" | "ghost" | "secondary" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

const buttonVariants = {
  primary: "bg-khata-green text-white shadow-sm hover:bg-khata-greenDark",
  outline:
    "border border-khata-border bg-white text-khata-ink shadow-sm hover:bg-khata-paperMuted",
  ghost: "text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink",
  secondary:
    "bg-khata-paperMuted text-khata-ink shadow-sm hover:bg-khata-border/40",
  danger:
    "bg-destructive text-white shadow-sm hover:bg-destructive/90",
};

const buttonSizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 py-2 text-sm",
  lg: "h-10 px-8 text-sm",
  icon: "h-9 w-9 p-0",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

type ActionLinkProps = {
  href: ComponentPropsWithoutRef<typeof Link>["href"] | string;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

export function ActionLink({
  href,
  children,
  variant = "outline",
  size = "sm",
  className,
}: ActionLinkProps) {
  return (
    <Link
      href={href as ComponentPropsWithoutRef<typeof Link>["href"]}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green [&_svg]:size-4 [&_svg]:shrink-0",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function TextLink({
  href,
  children,
  className,
}: {
  href: ComponentPropsWithoutRef<typeof Link>["href"] | string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href as ComponentPropsWithoutRef<typeof Link>["href"]}
      className={cn(
        "inline-flex items-center justify-end gap-1.5 text-sm font-semibold text-khata-green transition hover:text-khata-greenDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
    >
      {children}
    </Link>
  );
}

type InputProps = ComponentPropsWithoutRef<"input">;

export const controlClassName =
  "flex h-9 w-full rounded-md border border-khata-border bg-khata-paper px-3 py-1 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted/65 focus:border-khata-green focus:bg-white focus-visible:ring-1 focus-visible:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(controlClassName, className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return <select className={cn(controlClassName, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full resize-none rounded-md border border-khata-border bg-khata-paper px-3 py-2 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted/65 focus:border-khata-green focus:bg-white focus-visible:ring-1 focus-visible:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn("text-sm font-medium leading-none text-khata-ink", className)}
      {...props}
    />
  );
}

export const fieldLabelClassName = "k-eyebrow text-khata-muted";

export function FieldLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return <span className={cn(fieldLabelClassName, className)} {...props} />;
}

export function Field({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-destructive">{message}</p>;
}

export function FormMessage({
  message,
  tone = "danger",
  className,
}: {
  message?: string;
  tone?: "success" | "danger" | "info";
  className?: string;
}) {
  if (!message) {
    return null;
  }

  const toneClasses = {
    success: "border-success/30 bg-success/10 text-success",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    info: "border-info/30 bg-info/10 text-info",
  };

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-sm leading-6",
        toneClasses[tone],
        className,
      )}
    >
      {message}
    </div>
  );
}

export function FormActions({
  children,
  align = "end",
  className,
}: {
  children: React.ReactNode;
  align?: "start" | "end" | "between";
  className?: string;
}) {
  const alignClasses = {
    start: "justify-start",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "mt-5 flex flex-wrap items-center gap-2",
        alignClasses[align],
        className,
      )}
    >
      {children}
    </div>
  );
}

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-khata-border bg-white px-4 py-5 md:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="k-eyebrow text-khata-green">{eyebrow}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-normal text-khata-ink md:text-2xl">
            {title}
          </h1>
          {meta}
        </div>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}

export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 p-4 md:p-6", className)}>
      {children}
    </div>
  );
}

type SectionCardProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName = "p-4",
}: SectionCardProps) {
  return (
    <section className={cn("k-card overflow-hidden", className)}>
      {(title || description || actions) && (
        <div className="flex flex-col justify-between gap-2 border-b border-khata-border bg-khata-paperMuted/60 px-4 py-3 sm:flex-row sm:items-center">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-normal">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs leading-5 text-khata-muted">
                {description}
              </p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function RecordCount({
  value,
  label = "records",
}: {
  value: number;
  label?: string;
}) {
  return (
    <span className="font-mono text-xs text-khata-muted">
      {value} {label}
    </span>
  );
}

export function FilterBar({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"form">) {
  return (
    <form
      className={cn(
        "grid gap-3 rounded-md border border-khata-border bg-white p-4 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
}

export function QueryError({ message }: { message: string }) {
  return (
    <div className="p-4 text-sm font-medium text-destructive">
      {message}
    </div>
  );
}

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "brand";
  className?: string;
  onClick?: () => void;
};

const statToneClasses = {
  neutral: "before:bg-khata-muted",
  success: "before:bg-success",
  warning: "before:bg-warning",
  danger: "before:bg-destructive",
  info: "before:bg-info",
  brand: "before:bg-primary",
};

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
  className,
  onClick,
}: StatTileProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      {...(onClick ? { onClick, type: "button" as const } : {})}
      className={cn(
        "k-card k-card-hover relative w-full overflow-hidden p-4 pl-5 text-left before:absolute before:inset-y-0 before:left-0 before:w-1",
        onClick && "cursor-pointer",
        statToneClasses[tone],
        className,
      )}
    >
      <p className="k-eyebrow text-khata-muted">{label}</p>
      <p className="num mt-2 text-[26px] font-semibold leading-none text-khata-ink">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-5 text-khata-muted">{hint}</p>}
    </Comp>
  );
}

const iconPanelToneClasses = {
  neutral: "bg-khata-paperMuted text-khata-muted",
  brand: "bg-khata-green/10 text-khata-green",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function IconPanel({
  icon: Icon,
  title,
  description,
  tone = "brand",
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  tone?: keyof typeof iconPanelToneClasses;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("k-card p-4", className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-current/15",
            iconPanelToneClasses[tone],
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-khata-ink">{title}</h2>
            {action}
          </div>
          <p className="mt-1 text-sm leading-6 text-khata-muted">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

export function EmptyState({
  icon: Icon = ClipboardList,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-khata-border bg-khata-paperMuted text-khata-green">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-khata-ink">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
        {message}
      </p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function SetupRequired({
  title = "Workspace setup required",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="p-4 md:p-6">
      <SectionCard bodyClassName="p-5">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-khata-border bg-khata-paperMuted text-khata-green">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-normal text-khata-ink md:text-2xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
              {message}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading table rows" className="divide-y divide-khata-border">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, colIndex) => (
            <div
              key={colIndex}
              className="h-4 animate-pulse rounded bg-khata-paperMuted"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm leading-6 text-info">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function InlineAlert({
  children,
  tone = "danger",
  className,
}: {
  children: React.ReactNode;
  tone?: "warning" | "danger";
  className?: string;
}) {
  const toneClasses = {
    warning: "text-warning",
    danger: "text-destructive",
  };

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      <AlertTriangle className="size-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function PermissionNotice({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-khata-border bg-khata-paperMuted px-3 py-2 text-sm leading-6 text-khata-muted">
      <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function KeyValue({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className={fieldLabelClassName}>{label}</dt>
      <dd className={cn("mt-1 text-sm font-medium text-khata-ink", mono && "num")}>
        {value}
      </dd>
    </div>
  );
}

export function DetailList({
  items,
  labelWidth = "120px",
}: {
  items: Array<{
    label: string;
    value: React.ReactNode;
    mono?: boolean;
  }>;
  labelWidth?: string;
}) {
  return (
    <dl className="grid gap-0 text-sm">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-1 border-b border-khata-border py-3 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[var(--detail-label-width)_minmax(0,1fr)] sm:gap-3"
          style={
            {
              "--detail-label-width": labelWidth,
            } as CSSProperties
          }
        >
          <dt className={fieldLabelClassName}>{item.label}</dt>
          <dd
            className={cn(
              "min-w-0 break-words text-sm font-medium leading-6 text-khata-ink",
              item.mono && "num",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DataTable({
  children,
  minWidth = 760,
}: {
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-left text-sm"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

export const tableHeaderClass =
  "bg-khata-paperMuted/80 text-xs text-khata-muted";
export const tableHeadCellClass = "px-4 py-3 font-medium";
export const tableNumericHeadCellClass = `${tableHeadCellClass} text-right`;
export const tableActionHeadCellClass = tableNumericHeadCellClass;
export const tableRowClass =
  "k-row border-t border-khata-border transition-colors hover:bg-khata-paperMuted/55";
export const tableCellClass = "px-4 py-3";
export const tableNumericCellClass = `${tableCellClass} num text-right`;
export const tableActionCellClass = `${tableCellClass} text-right`;
export const tablePrimaryTextClass = "font-medium text-khata-ink";
export const tableSecondaryTextClass = "text-xs text-khata-muted";
export const tableMonoTextClass = "num text-xs";
