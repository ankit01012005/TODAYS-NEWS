"use client";

/// docs/19 §2.7 — filters that partition ONE list, never navigation
/// between different things. Each tab carries a count; at `xs` the strip
/// scrolls horizontally rather than collapsing into a dropdown, because
/// the counts are the point.
export interface TabItem {
  key: string;
  label: string;
  count: number;
}

export function Tabs({
  items,
  active,
  onChange,
}: {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
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
            className={`nav-link shrink-0 py-space-3 text-body-sm transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isActive ? "font-medium text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {item.label} <span className="text-ink-faint">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}
