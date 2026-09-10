"use client";

import { useState } from "react";
import { Button, ButtonVariant } from "./Button";

/// A two-step affordance for the product's few genuinely irreversible-
/// feeling actions (docs/10 §0 — "publishing is the one irreversible-
/// feeling act in the product... everything around it should be
/// deliberate, unambiguous"). The first click only reveals a plain-
/// language confirm/cancel row; the real action fires on the second.
export function ConfirmAction({
  label,
  confirmLabel,
  variant = "primary",
  loading,
  disabled,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button type="button" variant={variant} disabled={disabled} onClick={() => setConfirming(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
      <span className="text-body-sm text-ink">{confirmLabel}</span>
      <Button type="button" variant={variant} loading={loading} onClick={onConfirm}>
        Yes, {label.toLowerCase()}
      </Button>
      <Button type="button" variant="tertiary" disabled={loading} onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
