import { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

/// Inline notice — a 3px left rule in the semantic colour on its wash.
/// Failures go here, next to the control that failed; successes go to
/// the toast. `attention` is the gold surface (text in gold-deep, never
/// gold itself).
export type AlertVariant = "info" | "attention" | "success" | "danger";

const VARIANT: Record<AlertVariant, { box: string; title: string; icon: ReactNode }> = {
  info: { box: "border-info bg-info-wash", title: "text-ink", icon: <Info size={15} className="text-info" aria-hidden="true" /> },
  attention: {
    box: "border-gold bg-gold-wash",
    title: "text-gold-deep",
    icon: <AlertTriangle size={15} className="text-gold-deep" aria-hidden="true" />,
  },
  success: {
    box: "border-success bg-success-wash",
    title: "text-success",
    icon: <CheckCircle2 size={15} className="text-success" aria-hidden="true" />,
  },
  danger: { box: "border-danger bg-danger-wash", title: "text-danger", icon: <XCircle size={15} className="text-danger" aria-hidden="true" /> },
};

export function Alert({
  variant,
  title,
  children,
  className = "",
}: {
  variant: AlertVariant;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  const v = VARIANT[variant];
  return (
    <div role={variant === "danger" ? "alert" : "status"} className={`enter-rise border-l-[3px] px-space-4 py-space-3 ${v.box} ${className}`}>
      <div className="flex items-start gap-x-space-2">
        <span className="mt-[3px] shrink-0">{v.icon}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-body font-medium ${v.title}`}>{title}</p>
          {children ? <div className="mt-space-1 text-body-sm text-ink-secondary">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
