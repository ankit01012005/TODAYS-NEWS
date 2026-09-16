"use client";

import { motion } from "framer-motion";

/// Filters that partition ONE list, never navigation between different
/// things. Each tab carries a count; the active one is ink with a 2px
/// Sindoor underline that slides between tabs. At phone width the strip
/// scrolls horizontally rather than collapsing, because the counts are
/// the point.
export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  active,
  onChange,
  id = "tabs",
}: {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
  id?: string;
}) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-x-space-5 overflow-x-auto overflow-y-hidden border-b border-rule">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={`relative shrink-0 pb-space-2 pt-space-3 text-body-sm transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              isActive ? "font-medium text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span className={`ml-space-1 tabular-nums ${isActive ? "text-ink-secondary" : "text-ink-faint"}`}>({item.count})</span>
            ) : null}
            {isActive ? (
              <motion.span
                layoutId={`${id}-underline`}
                className="absolute inset-x-0 -bottom-px h-[2px] bg-brand"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
