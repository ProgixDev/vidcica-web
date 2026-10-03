import { Skeleton } from "@/components/ui/skeleton";

export default function AdsLoading() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <Skeleton className="h-11 w-64 rounded-full" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
