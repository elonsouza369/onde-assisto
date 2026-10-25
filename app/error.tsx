"use client";

import { ErrorState } from "@/components/ErrorState";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex-1 px-4 sm:px-8">
      <ErrorState onRetry={retry} />
    </main>
  );
}
