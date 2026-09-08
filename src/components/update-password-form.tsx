"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { Button } from "@/components/design-system";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "success" | "error";

export function UpdatePasswordForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("idle");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password.length < 8) {
      setStatus("error");
      setMessage("Use at least 8 characters.");
      setPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("success");
      setMessage("Password updated. You can now sign in with the new password.");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
      setMessage(
        "Password reset is available after Supabase Auth is configured.",
      );
    } finally {
      setPending(false);
    }
  }

  const messageTone =
    status === "success"
      ? "border-success/30 bg-success/10 text-success"
      : "border-destructive/30 bg-destructive/10 text-destructive";

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <label className="block">
        <span className="text-sm font-medium leading-none text-khata-ink">
          New password
        </span>
        <span className="relative mt-1.5 block">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            className="h-9 w-full rounded-md border border-khata-border bg-transparent px-3 py-1 pr-10 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted/55 focus:border-khata-green focus:bg-white focus:ring-1 focus:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-khata-muted transition hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium leading-none text-khata-ink">
          Confirm password
        </span>
        <input
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1.5 h-9 w-full rounded-md border border-khata-border bg-transparent px-3 py-1 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted/55 focus:border-khata-green focus:bg-white focus:ring-1 focus:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
        <p className="mt-1 text-xs leading-5 text-khata-muted">
          Use at least 8 characters.
        </p>
      </label>

      {message && (
        <div
          aria-live="polite"
          className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${messageTone}`}
        >
          {status === "success" && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{message}</p>
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {pending ? "Updating password..." : "Update password"}
      </Button>
    </form>
  );
}
