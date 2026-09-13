"use client";

import { type ComponentPropsWithoutRef } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/design-system";

type PendingSubmitButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "disabled" | "type"
> & {
  pendingLabel: string;
};

export function PendingSubmitButton({
  pendingLabel,
  children,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-disabled={pending}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
