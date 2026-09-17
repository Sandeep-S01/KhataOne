"use client";

import Form from "next/form";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { NavigationProgress } from "@/components/navigation-progress";

function FilterFields({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  const searchParams = useSearchParams();
  const fieldsRef = useRef<HTMLFieldSetElement>(null);
  const queryKey = searchParams.toString();

  // Next can restore a previously mounted page, including edits made before
  // leaving it. On activation, restore the server's defaults for its URL.
  useLayoutEffect(() => {
    fieldsRef.current?.form?.reset();
  }, [queryKey, children]);

  return (
    <>
      {/* Remount uncontrolled fields on committed URL changes (Clear, presets,
          Back/Forward), without resetting unsent edits during unrelated renders. */}
      <fieldset ref={fieldsRef} key={queryKey} disabled={pending} aria-busy={pending} className="contents">
        {children}
      </fieldset>
      <NavigationProgress pending={pending} label="Updating results…" />
    </>
  );
}

export function FilterNavigationForm({
  children,
  action,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Form>, "action"> & { action: string }) {
  return (
    <Form {...props} action={action as Route}>
      <FilterFields>{children}</FilterFields>
    </Form>
  );
}
