import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-10 w-40 rounded-md" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </main>
  );
}
