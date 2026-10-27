"use client";

import { useEffect, useState } from "react";
import { PlayIcon } from "./HeroParts";

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
        className="inline-flex items-center gap-2.5 rounded-sm bg-white px-7 py-2.5 text-lg font-bold text-black transition-colors hover:bg-white/80"
      >
        <PlayIcon className="h-6 w-6" />
        Ver trailer
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Trailer"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-5xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 stroke-current stroke-2">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
                Fechar
              </button>
            </div>
            <iframe
              title="Trailer"
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded-sm shadow-[0_0_80px_rgba(229,9,20,0.25)]"
            />
          </div>
        </div>
      )}
    </>
  );
}
