import { SkeletonGrid } from "@/components/SkeletonGrid";

export default function Loading() {
  return (
    <main className="flex-1 px-4 pb-8 sm:px-8">
      <SkeletonGrid />
    </main>
  );
}
