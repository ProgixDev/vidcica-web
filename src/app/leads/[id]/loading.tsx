import { Skeleton } from "@/components/ui/skeleton";

export default function LeadLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </main>
  );
}
