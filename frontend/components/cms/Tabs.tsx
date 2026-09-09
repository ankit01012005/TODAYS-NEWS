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
    <div role="tablist" className="flex gap-x-space-5 overflow-x-auto border-b border-rule">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={`shrink-0 border-b-2 py-space-3 text-body-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isActive ? "border-ink text-ink" : "border-transparent text-ink-muted"
            }`}
          >
            {item.label} <span className="text-ink-faint">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}
