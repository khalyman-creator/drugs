"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/#about", label: "About Us" },
  { href: "/shipping", label: "Shipping Policy" },
  { href: "/refunds", label: "Refund Policy" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function PolicyShortcuts() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="fixed left-0 top-1/2 z-40 -translate-y-1/2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="About and policies quick links"
        className="flex flex-col items-center gap-1 rounded-r-xl border-2 border-l-0 border-gray-900 bg-white px-2 py-3 shadow-md transition hover:bg-gray-50"
      >
        <svg
          className="h-4 w-4 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-700">Info</span>
      </button>

      {open && (
        <div className="absolute left-full top-1/2 ml-2 w-56 max-w-[80vw] -translate-y-1/2 rounded-2xl border-2 border-gray-900 bg-white p-3 shadow-xl">
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
            About &amp; Policies
          </p>
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-600"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
