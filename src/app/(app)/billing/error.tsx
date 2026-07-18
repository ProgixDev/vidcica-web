"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function BillingError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-4xl items-center justify-center px-6 py-8">
      <EmptyState
        title="Impossible de charger votre abonnement"
        description="Une erreur est survenue. Réessayez."
        action={<Button onClick={reset}>Réessayer</Button>}
      />
    </main>
  );
}
