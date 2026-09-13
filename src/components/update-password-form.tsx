"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { Button } from "@/components/design-system";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "success" | "error";
type ErrorField = "password" | "confirm_password" | null;

export function UpdatePasswordForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errorField, setErrorField] = useState<ErrorField>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setStatus("idle");
    setMessage("");
    setErrorField(null);

    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password.length < 8) {
      setStatus("error");
      setMessage("Use at least 8 characters.");
      setErrorField("password");
      setPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      setErrorField("confirm_password");
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        setErrorField(null);
        return;
      }

      setStatus("success");
      setMessage("Password updated. You can now sign in with the new password.");
      setErrorField(null);
      form.reset();
    } catch {
      setStatus("error");
      setErrorField(null);
      setMessage(
        "Password reset is available after Supabase Auth is configured.",
      );
    } finally {
      setPending(false);
    }
  }

  const messageTone =
    status === "success"
      ? "border-success/35 bg-success/10 text-success-foreground"
      : "border-destructive/35 bg-destructive/10 text-destructive-foreground";
  const passwordErrorId = errorField === "password" ? "update-password-error" : undefined;
  const confirmPasswordErrorId =
    errorField === "confirm_password" ? "update-password-error" : undefined;

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <label className="block">
        <span className="text-sm font-medium leading-none text-khata-ink">
          New password
        </span>
        <span className="relative mt-1.5 block">
          <input
            id="new-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={errorField === "password"}
            aria-describedby={passwordErrorId}
            className="h-11 w-full rounded-md border border-khata-border bg-transparent px-3 py-1 pr-12 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted/55 focus:border-khata-green focus:bg-white focus:ring-1 focus:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:pr-10 md:text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="new-password confirm-password"
            className="absolute right-0 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-khata-muted transition hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green md:right-1 md:size-9"
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
          id="confirm-password"
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={errorField === "confirm_password"}
          aria-describedby={confirmPasswordErrorId || "confirm-password-help"}
          className="mt-1.5 h-11 w-full rounded-md border border-khata-border bg-transparent px-3 py-1 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted/55 focus:border-khata-green focus:bg-white focus:ring-1 focus:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:text-sm"
        />
        <p id="confirm-password-help" className="mt-1 text-xs leading-5 text-khata-muted">
          Use at least 8 characters.
        </p>
      </label>

      {message && (
        <div
          id="update-password-error"
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
