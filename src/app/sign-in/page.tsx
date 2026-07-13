import { Suspense } from "react";
import { AuthPanel } from "@/features/auth";

export const metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex items-center gap-2">
        <span aria-hidden className="bg-primary inline-block size-3 rounded-full" />
        <span className="text-lg font-semibold tracking-tight">Vidcica</span>
      </div>
      <Suspense>
        <AuthPanel />
      </Suspense>
    </main>
  );
}
