import { Skeleton } from "@/components/ui/skeleton";

export default function LeadLoading() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-56 max-w-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="h-56 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}
