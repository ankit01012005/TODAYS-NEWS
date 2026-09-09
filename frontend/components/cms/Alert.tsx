import { ReactNode } from "react";

/// docs/19 §2.11. 3px left rule in the semantic colour, wash background.
export type AlertVariant = "info" | "attention" | "success" | "danger";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info: "border-ink-muted bg-surface",
  attention: "border-attention bg-attention-wash",
  success: "border-success bg-success-wash",
  danger: "border-danger bg-danger-wash",
};

export function Alert({
  variant,
  title,
  children,
}: {
  variant: AlertVariant;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={`border-l-[3px] px-space-4 py-space-3 ${VARIANT_CLASSES[variant]}`}>
      <p className="text-body font-medium text-ink">{title}</p>
      {children ? <div className="mt-space-1 text-body-sm text-ink-secondary">{children}</div> : null}
    </div>
  );
}
