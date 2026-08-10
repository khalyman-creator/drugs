"use client";

import { useEffect, useState } from "react";

export function AnnouncementBar({
  enabled,
  messages,
}: {
  enabled: boolean;
  messages: string;
}) {
  const items = messages
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  if (!enabled || items.length === 0) return null;

  return (
    <div className="bg-gray-900 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white">
      <p key={index} className="px-4">
        {items[index % items.length]}
      </p>
    </div>
  );
}
