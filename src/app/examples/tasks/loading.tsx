import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center justify-center px-6">
      <div className="w-full max-w-md space-y-3" aria-busy="true" aria-label="Loading tasks">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </main>
  );
}
