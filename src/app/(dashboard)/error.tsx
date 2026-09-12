"use client";

import { RotateCw } from "lucide-react";

import { Button, PageBody } from "@/components/design-system";

export default function WorkspaceError({ retry }: { retry: () => void }) {
  return (
    <main className="min-h-screen bg-khata-paper text-khata-ink">
      <PageBody>
        <div className="max-w-lg space-y-4 py-8" role="alert">
          <h1 className="text-xl font-semibold">Workspace unavailable</h1>
          <p className="text-sm text-khata-muted">
            The workspace could not be loaded. Please try again.
          </p>
          <Button onClick={() => retry()} className="min-h-11">
            <RotateCw aria-hidden="true" />
            Try again
          </Button>
        </div>
      </PageBody>
    </main>
  );
}
