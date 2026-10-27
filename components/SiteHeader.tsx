"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 flex items-center px-4 py-4 transition-colors duration-500 sm:px-12 ${
        scrolled ? "bg-black" : "bg-linear-to-b from-black/80 to-transparent"
      }`}
    >
      <Link
        href="/"
        aria-label="Onde Assisto"
        className="font-display text-3xl leading-none tracking-wide text-accent sm:text-4xl"
      >
        ONDE ASSISTO
      </Link>
    </header>
  );
}
