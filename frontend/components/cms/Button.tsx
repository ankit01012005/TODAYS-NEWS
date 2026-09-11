"use client";

import { ButtonHTMLAttributes } from "react";

/// docs/19 §2.1. Deliberately NO `publish` variant is defined here at
/// all — not a prop this component accepts and hides, the value doesn't
/// exist in this file's type. `BR-05`: the editor's world has no publish
/// control anywhere; 5D's admin review screen defines its OWN button
/// variant for that one screen rather than adding it here, so it is
/// structurally impossible for an editor-facing screen built from this
/// component to render one by mistake (docs/19 §2.1 rule 1).
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-paper hover:bg-accent-hover",
  secondary: "bg-paper border border-rule-strong text-ink hover:bg-surface",
  tertiary: "bg-transparent text-accent hover:underline",
  destructive: "bg-paper border border-danger text-danger hover:bg-danger hover:text-paper",
  link: "bg-transparent text-accent underline",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-space-3 text-body-sm",
  md: "h-10 px-space-4 text-body",
  lg: "h-12 px-space-5 text-body",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

/// `loading`: docs/12 §0's "Saving/working" state — the control is inert
/// and the label is replaced, so the action cannot be triggered twice.
export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-sm font-medium transition-[background-color,border-color,color,transform] duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-faint disabled:border-rule disabled:active:translate-y-0 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? "Working…" : children}
    </button>
  );
}
