"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center justify-center px-6">
      <EmptyState
        title="The task list hit a problem."
        description="Your tasks are safe. Try again — if it keeps failing, let the team know."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </main>
  );
}
