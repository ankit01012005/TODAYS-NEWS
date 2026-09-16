import Link from "next/link";
import { ReactNode } from "react";

/// The CMS's small set of layout pieces, drawn once: a page header in
/// the coaching voice ("Good morning, Ankit." / "Four stories are
/// waiting."), the white bordered panel with an uppercase heading, a
/// list frame with hairline rows, and the dashed empty state.

export function PageHeader({
  title,
  lede,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-space-5 gap-y-space-3">
      <div className="min-w-0">
        {eyebrow ? <p className="text-label text-ink-muted">{eyebrow}</p> : null}
        <h1 className="text-heading-1 text-ink">{title}</h1>
        {lede ? <p className="mt-space-1 max-w-[64ch] text-body text-ink-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-x-space-2 gap-y-space-2">{actions}</div> : null}
    </div>
  );
}

export type PanelTone = "paper" | "gold" | "danger" | "success" | "ink" | "sunken" | "info";

const TONE: Record<PanelTone, { box: string; heading: string }> = {
  paper: { box: "border-rule-strong bg-paper", heading: "text-ink" },
  gold: { box: "border-gold bg-gold-wash", heading: "text-gold-deep" },
  danger: { box: "border-danger bg-danger-wash", heading: "text-danger" },
  success: { box: "border-success bg-success-wash", heading: "text-success" },
  ink: { box: "border-ink bg-paper", heading: "text-ink" },
  sunken: { box: "border-rule-strong bg-surface-sunken", heading: "text-ink-muted" },
  info: { box: "border-info bg-info-wash", heading: "text-info" },
};

export function Panel({
  heading,
  headingAside,
  tone = "paper",
  padding = "md",
  children,
  className = "",
  as: Tag = "section",
  id,
}: {
  heading?: ReactNode;
  headingAside?: ReactNode;
  tone?: PanelTone;
  padding?: "none" | "sm" | "md";
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "aside" | "article";
  id?: string;
}) {
  const t = TONE[tone];
  const pad = padding === "none" ? "" : padding === "sm" ? "p-space-3" : "p-space-4";
  return (
    <Tag id={id} className={`border ${t.box} ${pad} ${className}`}>
      {heading ? (
        <div className={`flex items-center justify-between gap-x-space-3 ${padding === "none" ? "border-b border-rule px-space-4 py-space-3" : "mb-space-3"}`}>
          <h2 className={`text-label ${t.heading}`}>{heading}</h2>
          {headingAside}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}

export function ListFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border border-rule-strong bg-paper ${className}`}>{children}</div>;
}

export function ListRow({
  children,
  className = "",
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`border-b border-rule last:border-b-0 ${highlight ? "bg-gold-wash" : ""} ${className}`}>{children}</div>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="px-space-4 py-space-5 text-body-sm text-ink-muted">{children}</p>;
}

export function CmsEmpty({
  title,
  body,
  action,
  children,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-rule-strong px-space-4 py-space-6 text-center">
      <p className="text-heading-4 text-ink">{title}</p>
      {body ? <p className="mx-auto mt-space-1 max-w-[48ch] text-body-sm text-ink-muted">{body}</p> : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-space-3 inline-flex h-8 items-center bg-accent px-space-3 text-body-sm font-medium text-paper no-underline transition-colors hover:bg-accent-hover"
        >
          {action.label}
        </Link>
      ) : null}
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  href,
  tone = "ink",
  detail,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  tone?: "ink" | "success" | "muted" | "brand" | "gold";
  detail?: string;
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "muted"
        ? "text-ink-muted"
        : tone === "brand"
          ? "text-brand"
          : tone === "gold"
            ? "text-gold-deep"
            : "text-ink";
  const inner = (
    <>
      <p className={`text-numeral-sm ${color}`}>{value}</p>
      <p className="mt-space-1 text-caption text-ink-muted">{label}</p>
      {detail ? <p className="mt-space-1 text-mono-sm text-ink-faint">{detail}</p> : null}
    </>
  );
  const box = "block border border-rule-strong bg-paper p-space-3 no-underline";
  if (!href) return <div className={box}>{inner}</div>;
  return (
    <Link href={href} className={`${box} card-lift hover:border-ink`}>
      {inner}
    </Link>
  );
}
