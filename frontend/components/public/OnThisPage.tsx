"use client";

import { useEffect, useState } from "react";

/// 2d's "ON THIS PAGE" rail: the section headings of a long static page,
/// with the one in view marked by a 2px red left rule. Sticky at md+, a
/// horizontal rail on a phone. Uses an IntersectionObserver over the
/// headings' ids, so it works for any page that passes them in.
export function OnThisPage({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );
    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page" className="md:sticky md:top-16">
      <p className="text-label text-ink-muted">On this page</p>
      <ul className="no-scrollbar mt-space-3 flex gap-x-space-4 overflow-x-auto md:flex-col md:gap-x-0 md:gap-y-space-2">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`block border-l-2 pl-space-2 text-body-sm !no-underline transition-colors duration-(--duration-fast) ${
                  isActive ? "border-brand !text-brand" : "border-transparent !text-ink-muted hover:!text-ink"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
