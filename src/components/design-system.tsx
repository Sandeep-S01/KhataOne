import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Info,
  LockKeyhole,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import { cn } from "@/lib/utils";
import { FilterNavigationForm } from "@/components/filter-navigation-form";
import { LinkNavigationProgress } from "@/components/navigation-progress";

export const functionalIconClassName = "size-4 shrink-0";
export const functionalIconStrokeWidth = 2;
export const RetryIcon = RefreshCw;
export const tinyLabelClassName = "text-[11px] font-semibold uppercase tracking-[0.06em]";
export const sidebarSectionLabelClassName = "px-3 pb-1.5 text-[10px] font-bold uppercase leading-[14px] tracking-[0.08em] text-khata-muted";
export const dashboardMetricValueClassName = "num mt-1 text-lg font-semibold text-khata-ink";
export const dashboardMetaNumericClassName = "num mt-1 text-[11px] text-khata-muted";
export const dashboardStatValueClassName = "num mt-2 text-4xl font-bold leading-10 tracking-[-0.03em] text-khata-ink";
export const topbarIconButtonClassName = "inline-flex size-9 items-center justify-center rounded-md text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green";
export const profilePillClassName = "hidden h-9 min-w-0 items-center gap-2 rounded-full bg-khata-paperMuted/70 px-2 py-1 sm:flex";
export const commandDialogPanelClassName = "w-full max-w-2xl overflow-hidden rounded-xl border border-khata-border/90 bg-khata-surface shadow-lg";
export const commandInputClassName = "h-10 w-full border-0 bg-transparent text-base text-khata-ink outline-none placeholder:text-khata-muted md:text-sm";
export const commandSelectedBadgeClassName = `${tinyLabelClassName} rounded-full bg-khata-surface px-2 py-0.5 text-khata-green`;
export const mutedPanelClassName = "rounded-md border border-khata-border bg-khata-paperMuted px-3 py-3 text-sm leading-6 text-khata-muted";
export const authSidePanelSurfaceClassName = "mt-8 rounded-md border border-khata-border bg-khata-surface p-4 shadow-sm";
export const publicBrandHomeLinkClassName = "inline-flex min-h-11 items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green md:min-h-0";
export const authBackLinkClassName = "mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-khata-muted transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green md:min-h-0";
export const feedbackToneClassName = {
  success: "border-success/35 bg-success/10 text-success-foreground",
  danger: "border-destructive/35 bg-destructive/10 text-destructive-foreground",
  info: "border-info/35 bg-info/10 text-info-foreground",
  warning: "border-warning/40 bg-warning/10 text-warning-foreground",
} as const;

type TopbarIconButtonProps = ComponentPropsWithoutRef<"button">;

export function TopbarIconButton({
  className,
  type = "button",
  ...props
}: TopbarIconButtonProps) {
  return (
    <button
      type={type}
      className={cn(topbarIconButtonClassName, className)}
      {...props}
    />
  );
}

type ProfilePillProps = {
  email: string;
  roleLabel: string;
  initial: string;
  className?: string;
};

export function ProfilePill({ email, roleLabel, initial, className }: ProfilePillProps) {
  return (
    <div className={cn(profilePillClassName, className)} title={email}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-khata-ink text-[11px] font-semibold text-white shadow-sm">
        {initial}
      </span>
      <span className="hidden min-w-0 items-baseline gap-1.5 lg:flex">
        <span className="max-w-32 truncate text-sm font-semibold text-khata-ink">
          {email}
        </span>
        <span className="max-w-20 truncate text-xs capitalize text-khata-muted">
          {roleLabel}
        </span>
      </span>
    </div>
  );
}

const iconBadgeToneClasses = {
  brand: "bg-khata-green/10 text-khata-green",
  neutral: "bg-khata-paperMuted text-khata-muted",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function IconBadge({
  icon: Icon,
  tone = "brand",
  className,
}: {
  icon: LucideIcon;
  tone?: keyof typeof iconBadgeToneClasses;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
        iconBadgeToneClasses[tone],
        className,
      )}
    >
      <Icon
        className={functionalIconClassName}
        strokeWidth={functionalIconStrokeWidth}
        aria-hidden="true"
      />
    </span>
  );
}

export type StatusBadgeTone = keyof typeof statusBadgeToneClasses;

const statusBadgeToneClasses = {
  neutral: "border-khata-border bg-khata-paperMuted text-khata-muted",
  success: "border-success/30 bg-success/10 text-success-foreground",
  warning: "border-warning/35 bg-warning/10 text-warning-foreground",
  danger: "border-destructive/30 bg-destructive/10 text-destructive-foreground",
  info: "border-info/35 bg-info/10 text-info-foreground",
  brand: "border-khata-green/30 bg-khata-green/10 text-khata-green",
};

export function StatusBadge({
  tone = "neutral",
  className,
  ...props
}: ComponentPropsWithoutRef<"span"> & {
  tone?: StatusBadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4",
        statusBadgeToneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

type CommandOptionProps = ComponentPropsWithoutRef<"button"> & {
  title: string;
  description: string;
  selected?: boolean;
};

export function CommandOption({
  title,
  description,
  selected = false,
  className,
  type = "button",
  ...props
}: CommandOptionProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green",
        selected
          ? "border-khata-green/35 bg-khata-green/10 shadow-sm"
          : "border-transparent hover:bg-khata-paperMuted",
        className,
      )}
      {...props}
    >
      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-khata-ink">
        {title}
        {selected && (
          <span className={commandSelectedBadgeClassName}>Selected</span>
        )}
      </span>
      <span className="mt-1 block text-xs leading-5 text-khata-muted">
        {description}
      </span>
    </button>
  );
}

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
  sm: "h-11 px-3 text-xs md:h-8",
  md: "h-11 px-4 py-2 text-sm md:h-9",
  lg: "h-11 px-8 text-sm md:h-10",
  icon: "h-11 w-11 p-0 md:h-9 md:w-9",
};

export const externalActionLinkClassName = cn(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-2",
  buttonVariants.outline,
  buttonSizes.md,
);

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
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-2",
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
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-2",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
    >
      {children}
      <LinkNavigationProgress />
    </Link>
  );
}

export function TextLink({
  href,
  children,
  className,
  ...props
}: {
  href: ComponentPropsWithoutRef<typeof Link>["href"] | string;
  children: React.ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "children" | "className">) {
  return (
    <Link
      href={href as ComponentPropsWithoutRef<typeof Link>["href"]}
      className={cn(
        "inline-flex min-h-11 items-center justify-end gap-1.5 text-sm font-semibold text-khata-green transition hover:text-khata-greenDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green md:min-h-0 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-2",
        className,
      )}
      {...props}
    >
      {children}
      <LinkNavigationProgress />
    </Link>
  );
}

type InputProps = ComponentPropsWithoutRef<"input">;

export const controlClassName =
  cn(
    "flex h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 py-1 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted focus:border-khata-green focus:bg-white focus-visible:ring-1 focus-visible:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:text-sm",
    "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
  );
export const authControlClassName = cn(controlClassName, "bg-transparent");
export const filterControlCompactClassName = "md:h-8 md:text-[13px]";
export const filterActionRowClassName = "justify-start border-t border-khata-border/70 pt-3 sm:justify-end";
export const filterInlineGridClassName =
  "min-w-0 items-center md:grid-cols-2 xl:grid-cols-[minmax(130px,0.8fr)_minmax(140px,0.8fr)_minmax(120px,0.7fr)_minmax(250px,1fr)_auto]";
export const filterInlineControlClassName = "h-10 text-[13px] md:h-9 md:text-[13px]";
export const filterInlineButtonClassName = "h-10 min-w-24 px-4 text-sm md:h-9";
export const filterInlineActionsClassName =
  "min-w-0 items-center self-end border-0 pt-0 md:col-span-2 xl:col-span-1 xl:flex-nowrap xl:justify-start";
export const filterDateRangeInputClassName =
  "h-10 rounded-none border-0 bg-transparent px-3 text-[13px] shadow-none focus:bg-transparent focus-visible:ring-0 md:h-9 md:text-[13px]";

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(controlClassName, className)}
      {...props}
    />
  );
}

type InputWithIconProps = InputProps & {
  icon?: LucideIcon;
  inputClassName?: string;
};

export function InputWithIcon({
  icon: Icon = Search,
  className,
  inputClassName,
  ...props
}: InputWithIconProps) {
  return (
    <div className={cn("relative", className)}>
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-khata-muted"
        strokeWidth={functionalIconStrokeWidth}
        aria-hidden="true"
      />
      <Input className={cn("pl-9", inputClassName)} {...props} />
    </div>
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
        "flex min-h-24 w-full resize-y rounded-md border border-khata-border bg-khata-paper px-3 py-2 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted focus:border-khata-green focus:bg-white focus-visible:ring-1 focus-visible:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
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
      {error && <p className="text-xs font-medium text-destructive-foreground">{error}</p>}
    </div>
  );
}

export function FilterField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className={fieldLabelClassName}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterInlineField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="sr-only">
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterDateRangeField({
  fromId,
  toId,
  fromName,
  toName,
  fromDefaultValue,
  toDefaultValue,
  className,
}: {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  fromDefaultValue?: string;
  toDefaultValue?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] overflow-hidden rounded-md border border-khata-border bg-khata-paper shadow-sm transition focus-within:border-khata-green focus-within:bg-white focus-within:ring-1 focus-within:ring-khata-green",
        className,
      )}
    >
      <label htmlFor={fromId} className="sr-only">
        From date
      </label>
      <Input
        id={fromId}
        name={fromName}
        type="date"
        defaultValue={fromDefaultValue}
        className={filterDateRangeInputClassName}
      />
      <span className="flex h-10 items-center justify-center border-x border-khata-border bg-white/55 text-xs font-medium text-khata-muted md:h-9">
        to
      </span>
      <label htmlFor={toId} className="sr-only">
        To date
      </label>
      <Input
        id={toId}
        name={toName}
        type="date"
        defaultValue={toDefaultValue}
        className={filterDateRangeInputClassName}
      />
    </div>
  );
}

export function FieldError({
  message,
  id,
}: {
  message?: string;
  id?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      role="status"
      className="mt-1 text-xs font-medium text-destructive-foreground"
    >
      {message}
    </p>
  );
}

export function FormMessage({
  message,
  tone = "danger",
  className,
  role,
  ...props
}: {
  message?: string;
  tone?: keyof typeof feedbackToneClassName;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">) {
  if (!message) {
    return null;
  }

  return (
    <div
      role={role}
      aria-live="polite"
      className={cn(
        "rounded-md border px-3 py-2 text-sm leading-6",
        feedbackToneClassName[tone],
        className,
      )}
      {...props}
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

export const pageHeaderClassName =
  "flex flex-col gap-3 border-b border-khata-border bg-white px-4 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between";
export const pageTitleClassName =
  "text-[1.375rem] font-bold leading-7 tracking-[-0.02em] text-khata-ink";
export const pageDescriptionClassName =
  "mt-2 max-w-3xl text-[13px] leading-[18px] text-khata-muted";
export const panelTitleClassName =
  "text-xl font-semibold leading-7 tracking-normal text-khata-ink";
export const sectionCardHeaderClassName =
  "flex flex-col justify-between gap-2 border-b border-khata-border bg-khata-paperMuted/60 px-4 py-3 sm:flex-row sm:items-center";
export const sectionCardTitleClassName =
  "text-[15px] font-semibold leading-5 tracking-[-0.01em] text-khata-ink";
export const sectionCardDescriptionClassName =
  "mt-0.5 text-xs leading-5 text-khata-muted";

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <header className={pageHeaderClassName}>
      <div className="min-w-0">
        {eyebrow && <p className="k-eyebrow text-khata-green">{eyebrow}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <h1 className={pageTitleClassName}>
            {title}
          </h1>
          {meta}
        </div>
        {description && (
          <p className={pageDescriptionClassName}>
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
    <div className={cn("space-y-6 p-4 md:p-6 lg:px-8", className)}>
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
        <div className={sectionCardHeaderClassName}>
          <div>
            {title && <h2 className={sectionCardTitleClassName}>{title}</h2>}
            {description && (
              <p className={sectionCardDescriptionClassName}>
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
  singularLabel = label === "records" ? "record" : undefined,
}: {
  value: number;
  label?: string;
  singularLabel?: string;
}) {
  const resolvedLabel = value === 1 && singularLabel ? singularLabel : label;

  return (
    <span className="num text-xs text-khata-muted">
      {value} {resolvedLabel}
    </span>
  );
}

type PaginationControlsProps = {
  basePath: string;
  page: number;
  hasNext: boolean;
  searchParams?: Record<string, string | undefined>;
  label?: string;
};

export function PaginationControls({
  basePath,
  page,
  hasNext,
  searchParams,
  label = "records",
}: PaginationControlsProps) {
  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();

    Object.entries(searchParams ?? {}).forEach(([key, value]) => {
      if (key !== "page" && value) {
        params.set(key, value);
      }
    });

    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const disabledClassName = cn(
    "inline-flex h-11 items-center justify-center rounded-md border border-khata-border bg-khata-paperMuted px-3 text-xs font-medium text-khata-muted opacity-60 md:h-8",
  );

  return (
    <div className="flex flex-col gap-2 border-t border-khata-border bg-khata-paperMuted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="num text-xs text-khata-muted">
        Page {page} - {label}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <ActionLink href={pageHref(page - 1)} size="sm" variant="outline">
            Previous
          </ActionLink>
        ) : (
          <span aria-disabled="true" className={disabledClassName}>
            Previous
          </span>
        )}
        {hasNext ? (
          <ActionLink href={pageHref(page + 1)} size="sm" variant="outline">
            Next
          </ActionLink>
        ) : (
          <span aria-disabled="true" className={disabledClassName}>
            Next
          </span>
        )}
      </div>
    </div>
  );
}

export function FilterBar({
  children,
  className,
  action,
  method,
  encType,
  target,
  ...props
}: ComponentPropsWithoutRef<"form">) {
  const formClassName = cn(
    "grid gap-3 rounded-md border border-khata-border bg-white p-4 shadow-sm",
    className,
  );

  // Only URL filters use soft navigation. Server Actions and explicit native
  // form modes retain their existing submission and pending-state behavior.
  if (typeof action === "string" && !method && !encType && !target) {
    return (
      <FilterNavigationForm {...props} action={action} className={formClassName}>
        {children}
      </FilterNavigationForm>
    );
  }

  return (
    <form
      {...props}
      action={action}
      method={method}
      encType={encType}
      target={target}
      className={formClassName}
    >
      {children}
    </form>
  );
}

export function FilterGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 lg:items-end", className)}>
      {children}
    </div>
  );
}

export function FilterActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-2", className)}>
      {children}
    </div>
  );
}

type FilterPresetLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "href" | "className"
> & {
  href: ComponentPropsWithoutRef<typeof Link>["href"] | string;
  active?: boolean;
  count?: React.ReactNode;
  dotTone?: "brand" | "warning" | "danger" | "info";
  className?: string;
};

const filterPresetDotToneClasses = {
  brand: "bg-khata-green",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
};

const filterPresetCountToneClasses = {
  brand: "bg-khata-green/10 text-khata-green",
  warning: "bg-warning/15 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive-foreground",
  info: "bg-info/10 text-info-foreground",
};

export function FilterPresetLink({
  href,
  active = false,
  count,
  dotTone,
  children,
  className,
  ...props
}: FilterPresetLinkProps) {
  const countTone = dotTone ?? "brand";

  return (
    <Link
      href={href as ComponentPropsWithoutRef<typeof Link>["href"]}
      className={cn(
        "inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green",
        active
          ? "border-khata-green bg-khata-green text-white shadow-sm hover:bg-khata-greenDark"
          : "border-khata-border bg-white text-khata-ink hover:border-khata-green/40 hover:bg-khata-paperMuted",
        className,
      )}
      {...props}
    >
      {dotTone && !active && (
        <span
          aria-hidden="true"
          className={cn("size-2 rounded-full", filterPresetDotToneClasses[dotTone])}
        />
      )}
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            "num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
            active
              ? "bg-white/20 text-white"
              : filterPresetCountToneClasses[countTone],
          )}
        >
          {count === null ? "n/a" : count}
        </span>
      )}
      <LinkNavigationProgress />
    </Link>
  );
}

export function TableToolbar({
  title,
  description,
  meta,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-khata-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className={sectionCardTitleClassName}>{title}</h2>
          {meta && (
            <>
              <span className="hidden h-5 w-px bg-khata-border sm:block" aria-hidden="true" />
              {meta}
            </>
          )}
        </div>
        {description && (
          <p className={sectionCardDescriptionClassName}>{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

export function QueryError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="border-t border-destructive/20 bg-destructive/5 p-4 text-sm font-medium leading-6 text-destructive-foreground"
    >
      {message}
    </div>
  );
}

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tags?: Array<{
    label: React.ReactNode;
    tone?: StatusBadgeTone;
  }>;
  href?: ComponentPropsWithoutRef<typeof Link>["href"] | string;
  actionLabel?: string;
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
  tags = [],
  href,
  actionLabel,
  tone = "neutral",
  className,
  onClick,
}: StatTileProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      {...(onClick ? { onClick, type: "button" as const } : {})}
      className={cn(
        "k-card relative flex min-h-[164px] w-full flex-col overflow-hidden p-5 pl-6 text-left before:absolute before:inset-y-0 before:left-0 before:w-1",
        onClick && "k-card-hover cursor-pointer",
        statToneClasses[tone],
        className,
      )}
    >
      <p className="k-eyebrow text-khata-muted">{label}</p>
      <p className={dashboardStatValueClassName}>{value}</p>
      {hint && <p className="mt-2 text-[13px] leading-[18px] text-khata-muted">{hint}</p>}
      {(tags.length > 0 || (href && actionLabel)) && (
        <div className="mt-auto pt-4">
          {tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <StatusBadge key={index} tone={tag.tone ?? "neutral"}>
                  {tag.label}
                </StatusBadge>
              ))}
            </div>
          )}
          {href && actionLabel && (
            <TextLink
              href={href}
              className="min-h-0 w-full justify-between text-xs font-semibold"
            >
              <span>{actionLabel}</span>
              <ArrowRight
                className={functionalIconClassName}
                strokeWidth={functionalIconStrokeWidth}
                aria-hidden="true"
              />
            </TextLink>
          )}
        </div>
      )}
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
          <Icon
            className={functionalIconClassName}
            strokeWidth={functionalIconStrokeWidth}
            aria-hidden="true"
          />
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
    <div className="flex flex-col items-center px-6 py-10 text-center md:py-12">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-khata-border bg-khata-paperMuted text-khata-green">
        <Icon
          className={functionalIconClassName}
          strokeWidth={functionalIconStrokeWidth}
          aria-hidden="true"
        />
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
            <LockKeyhole
              className={functionalIconClassName}
              strokeWidth={functionalIconStrokeWidth}
              aria-hidden="true"
            />
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
    <div className="flex gap-3 rounded-md border border-info/35 bg-info/10 px-3 py-2 text-sm leading-6 text-info-foreground">
      <Info
        className={`mt-0.5 ${functionalIconClassName}`}
        strokeWidth={functionalIconStrokeWidth}
        aria-hidden="true"
      />
      <div>{children}</div>
    </div>
  );
}

export function InlineAlert({
  children,
  tone = "danger",
  className,
  truncate = true,
}: {
  children: React.ReactNode;
  tone?: "warning" | "danger";
  className?: string;
  truncate?: boolean;
}) {
  const toneClasses = {
    warning: "text-warning-foreground",
    danger: "text-destructive-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      <AlertTriangle
        className={functionalIconClassName}
        strokeWidth={functionalIconStrokeWidth}
        aria-hidden="true"
      />
      <span className={truncate ? "truncate" : "min-w-0 whitespace-normal break-words leading-5"}>
        {children}
      </span>
    </span>
  );
}

export function PermissionNotice({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-khata-border bg-khata-paperMuted px-3 py-2 text-sm leading-6 text-khata-muted">
      <LockKeyhole
        className={`mt-0.5 ${functionalIconClassName}`}
        strokeWidth={functionalIconStrokeWidth}
        aria-hidden="true"
      />
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
  ariaLabel = "Scrollable data table",
}: {
  children: React.ReactNode;
  minWidth?: number;
  ariaLabel?: string;
}) {
  return (
    <div
      className="max-w-full overflow-x-auto k-scrollbar"
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <table
        className="w-full border-collapse text-left text-[13px]"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

export const tableHeaderClass =
  "sticky top-0 z-10 h-9 bg-khata-paperMuted/95 text-[11px] uppercase tracking-[0.04em] text-khata-muted";
export const tableHeadCellClass = "px-4 py-2.5 font-semibold leading-4";
export const tableNumericHeadCellClass = `${tableHeadCellClass} text-right`;
export const tableActionHeadCellClass = tableNumericHeadCellClass;
export const tableRowClass =
  "k-row border-t border-khata-border transition-colors hover:bg-khata-paperMuted/55";
export const tableCellClass = "px-4 py-2.5 align-middle";
export const tableNumericCellClass = `${tableCellClass} num text-right`;
export const tableActionCellClass = `${tableCellClass} text-right`;
export const tablePrimaryTextClass = "font-medium text-khata-ink";
export const tableSecondaryTextClass = "text-xs text-khata-muted";
export const tableNumericTextClass = "num text-[13px] font-medium";
