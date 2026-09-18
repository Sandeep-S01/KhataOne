"use client";

import {
  AlignJustify,
  Inbox,
  LayoutDashboard,
  List,
  ListChecks,
  Monitor,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useId, useState, useSyncExternalStore } from "react";

import { functionalIconClassName, functionalIconStrokeWidth } from "@/components/design-system";
import { startPageCookieName, type StartPage } from "@/lib/personal-preferences";
import { cn } from "@/lib/utils";

type ThemePreference = "system" | "light" | "dark";
type TableDensity = "comfortable" | "compact";
type Choice<Value extends string> = { value: Value; label: string; icon: LucideIcon };

const themeStorageKey = "khataone_theme";
const densityStorageKey = "khataone_table_density";
const preferenceChangeEvent = "khataone-preference-change";

const themeChoices: Choice<ThemePreference>[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];
const densityChoices: Choice<TableDensity>[] = [
  { value: "comfortable", label: "Comfortable", icon: List },
  { value: "compact", label: "Compact", icon: AlignJustify },
];
const startPageChoices: Choice<StartPage>[] = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "review", label: "Review queue", icon: ListChecks },
  { value: "inbox", label: "Inbox", icon: Inbox },
];

function readTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(themeStorageKey);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function readDensity(): TableDensity {
  try {
    return localStorage.getItem(densityStorageKey) === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(preferenceChangeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(preferenceChangeEvent, onChange);
  };
}

function writeBrowserPreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event(preferenceChangeEvent));
    return true;
  } catch {
    return false;
  }
}

function PreferenceChoices<Value extends string>({
  title,
  description,
  value,
  options,
  onChange,
  error,
}: {
  title: string;
  description: string;
  value: Value;
  options: Choice<Value>[];
  onChange: (value: Value) => void;
  error?: string;
}) {
  const groupId = useId();
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-khata-ink">{title}</legend>
      <p className="mt-1 text-xs leading-5 text-khata-muted">{description}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {options.map(({ value: optionValue, label, icon: Icon }) => (
          <label
            key={optionValue}
            htmlFor={`${groupId}-${optionValue}`}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-khata-green",
              value === optionValue
                ? "border-khata-green bg-khata-green/10 text-khata-green"
                : "border-khata-border bg-khata-surface text-khata-ink hover:bg-khata-paperMuted",
            )}
          >
            <input
              id={`${groupId}-${optionValue}`}
              type="radio"
              name={`${groupId}-preference`}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
              className="sr-only"
            />
            <Icon
              className={functionalIconClassName}
              strokeWidth={functionalIconStrokeWidth}
              aria-hidden="true"
            />
            {label}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive-foreground">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function PersonalPreferences({
  userId,
  initialStartPage,
}: {
  userId: string;
  initialStartPage: StartPage;
}) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system");
  const density = useSyncExternalStore(subscribe, readDensity, () => "comfortable");
  const [startPage, setStartPage] = useState(initialStartPage);
  const [themeError, setThemeError] = useState("");
  const [densityError, setDensityError] = useState("");
  const [startPageError, setStartPageError] = useState("");

  function changeStartPage(value: StartPage) {
    const name = startPageCookieName(userId);
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;

    if (document.cookie.split("; ").some((cookie) => cookie === `${name}=${value}`)) {
      setStartPage(value);
      setStartPageError("");
    } else {
      setStartPageError(
        "Your browser could not save the start page. Check your cookie settings and try again.",
      );
    }
  }

  return (
    <div className="space-y-5 divide-y divide-khata-border [&_fieldset+fieldset]:pt-5">
      <PreferenceChoices
        title="Theme"
        description="Choose how KhataOne looks on this browser. System follows your device appearance."
        value={theme}
        options={themeChoices}
        onChange={(value) =>
          setThemeError(
            writeBrowserPreference(themeStorageKey, value)
              ? ""
              : "Your browser could not save this theme. Check your storage settings and try again.",
          )
        }
        error={themeError}
      />
      <PreferenceChoices
        title="Table density"
        description="Compact fits more rows on desktop. Mobile rows keep their touch-friendly spacing."
        value={density}
        options={densityChoices}
        onChange={(value) =>
          setDensityError(
            writeBrowserPreference(densityStorageKey, value)
              ? ""
              : "Your browser could not save table density. Check your storage settings and try again.",
          )
        }
        error={densityError}
      />
      <PreferenceChoices
        title="Start page after sign-in"
        description="Choose where you begin after signing in. Overview remains available in the sidebar."
        value={startPage}
        options={startPageChoices}
        onChange={changeStartPage}
        error={startPageError}
      />
    </div>
  );
}
