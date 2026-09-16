"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

/// The CMS button. Square corners (the brand keeps pills for tags and
/// states), Sindoor Red for the one primary action on a screen, an ink
/// outline for everything else. `gold` is "Send back with notes" and
/// nothing else; `ghost` is for the dark composer toolbar.
///
/// Deliberately NO `publish` variant is defined here — the editor's
/// world has no publish control anywhere; the admin's decision panel
/// defines its own for that one screen, so it is structurally impossible
/// for an editor-facing screen built from this component to render one.
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive" | "gold" | "success" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "btn-sheen bg-accent text-paper border border-accent hover:bg-accent-hover hover:border-accent-hover",
  secondary: "bg-paper border border-ink text-ink hover:bg-ink hover:text-paper",
  tertiary: "bg-transparent border border-transparent text-ink-secondary hover:text-ink hover:bg-surface-sunken",
  destructive: "bg-paper border border-danger text-danger hover:bg-danger hover:text-paper",
  gold: "bg-paper border border-gold-deep text-gold-deep hover:bg-gold-wash",
  success: "bg-paper border border-success text-success hover:bg-success-wash",
  ghost: "bg-transparent border border-bone/50 text-bone hover:border-bone hover:bg-bone/10",
  link: "bg-transparent border border-transparent text-brand underline underline-offset-4 decoration-brand/50 hover:decoration-brand px-0",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-space-3 text-body-sm gap-x-space-1",
  md: "h-10 px-space-4 text-body gap-x-space-2",
  lg: "h-12 px-space-5 text-body gap-x-space-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
}

/// `loading`: the control is inert and the label is replaced, so the
/// action cannot be triggered twice.
export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  loadingLabel = "Working…",
  icon,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,transform] duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px disabled:cursor-not-allowed disabled:border-rule disabled:bg-surface-sunken disabled:text-ink-faint disabled:active:translate-y-0 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-pill border-[1.5px] border-current border-t-transparent" aria-hidden="true" />
          {loadingLabel}
        </>
      ) : (
        <>
          {icon ? <span className="shrink-0" aria-hidden="true">{icon}</span> : null}
          {children}
        </>
      )}
    </button>
  );
}
