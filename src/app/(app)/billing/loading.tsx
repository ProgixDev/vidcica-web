import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
