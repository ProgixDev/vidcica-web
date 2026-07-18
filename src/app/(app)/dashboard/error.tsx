"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// Route error boundary (AC-15 error state): plain-language message + recovery.
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-6xl items-center justify-center px-6 py-8">
      <EmptyState
        title="Impossible de charger vos vidéos"
        description="Une erreur est survenue. Vérifiez votre connexion, puis réessayez."
        action={<Button onClick={reset}>Réessayer</Button>}
      />
    </main>
  );
}
