import { Skeleton } from "@/components/ui/skeleton";

export default function NetworksLoading() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="bg-card flex w-full max-w-3xl flex-col rounded-lg py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-10 rounded-sm" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48 max-w-full" />
            </div>
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </>
  );
}
