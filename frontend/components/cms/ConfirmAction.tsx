"use client";

import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, ButtonVariant } from "./Button";
import { FIELD_CLASS } from "./TextField";

/// 2t "Confirm — two steps". The first click only reveals a plain-
/// language confirm/cancel row; the real action fires on the second.
/// `typeToConfirm` adds the strongest form (2t "Delete this story
/// permanently?"): the confirm button stays inert until the person has
/// typed the headline back.
export function ConfirmAction({
  label,
  confirmLabel,
  detail,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  typeToConfirm,
  yesLabel,
  onConfirm,
  icon,
}: {
  label: string;
  confirmLabel: string;
  detail?: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  disabled?: boolean;
  /// The exact text the person must type before the action is allowed.
  typeToConfirm?: string;
  yesLabel?: string;
  onConfirm: () => void;
  icon?: ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const typedOk = !typeToConfirm || typed.trim() === typeToConfirm.trim();

  return (
    <div>
      {!confirming ? (
        <Button type="button" variant={variant} size={size} disabled={disabled} icon={icon} onClick={() => setConfirming(true)}>
          {label}
        </Button>
      ) : null}
      <AnimatePresence initial={false}>
        {confirming ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className={`border p-space-3 ${variant === "destructive" ? "border-danger bg-paper" : "border-ink bg-paper"}`}
          >
            <p className="text-body font-medium text-ink">{confirmLabel}</p>
            {detail ? <div className="mt-space-1 text-body-sm text-ink-secondary">{detail}</div> : null}
            {typeToConfirm ? (
              <div className="mt-space-2">
                <label htmlFor="confirm-typed" className="sr-only">
                  Type “{typeToConfirm}” to confirm
                </label>
                <input
                  id="confirm-typed"
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={`type “${typeToConfirm}” to confirm`}
                  className={`h-9 ${FIELD_CLASS} border-danger text-body-sm`}
                />
              </div>
            ) : null}
            <div className="mt-space-3 flex flex-wrap items-center gap-x-space-2 gap-y-space-2">
              <Button type="button" variant={variant} size="sm" loading={loading} disabled={!typedOk} onClick={onConfirm}>
                {yesLabel ?? `Yes, ${label.toLowerCase()}`}
              </Button>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                disabled={loading}
                onClick={() => {
                  setConfirming(false);
                  setTyped("");
                }}
              >
                Keep it
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
