import { SkeletonGrid } from "@/components/SkeletonGrid";

export default function Loading() {
  return (
    <main className="flex-1">
      <div className="h-[60svh] animate-pulse bg-linear-to-b from-surface to-black" />
      <div className="px-4 sm:px-12">
        <SkeletonGrid />
      </div>
    </main>
  );
}
