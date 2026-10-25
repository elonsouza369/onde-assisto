"use client";

import { useEffect, useState } from "react";

export function TrailerModal({ trailerKey }: { trailerKey: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-accent px-5 py-2 font-semibold hover:brightness-110"
      >
        ▶ Ver trailer
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Trailer"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <div className="w-full max-w-4xl">
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-neutral-300 hover:text-white">
                Fechar
              </button>
            </div>
            <iframe
              title="Trailer"
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded"
            />
          </div>
        </div>
      )}
    </>
  );
}
