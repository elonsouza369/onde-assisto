"use client";

import { ErrorState } from "@/components/ErrorState";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex-1 px-4 pt-24 sm:px-12">
      <ErrorState onRetry={retry} />
    </main>
  );
}
