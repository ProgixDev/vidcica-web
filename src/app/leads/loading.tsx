import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <Skeleton className="h-6 w-32" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
