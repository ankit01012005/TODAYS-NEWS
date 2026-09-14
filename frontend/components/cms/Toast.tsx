"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/// docs/12 §0's "Saving/working → done" state, made visible. Every write in
/// the CMS ends in either a Toast (success) or an inline Alert (failure,
/// next to the control that failed) — a click that changes something on
/// the server never finishes silently. The provider lives in the root
/// layout, above every route, so a toast raised just before
/// router.push()/refresh() (sign-in → dashboard, set-password → sign-in,
/// submit → list) is still on screen when the next page renders.
///
/// Announced through aria-live so a screen reader hears "Saved" too.
export type ToastVariant = "success" | "info" | "danger";

export interface ToastOptions {
  /// Longer second line, when the title alone isn't enough.
  description?: string;
  variant?: ToastVariant;
  /// Milliseconds on screen. Errors stay a little longer by default.
  durationMs?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "variant" | "durationMs">> {
  id: number;
  title: string;
  description?: string;
}

interface ToastApi {
  toast: (title: string, options?: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION_MS: Record<ToastVariant, number> = { success: 4_000, info: 5_000, danger: 7_000 };
const MAX_VISIBLE = 3;

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "border-l-success",
  info: "border-l-accent",
  danger: "border-l-danger",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((title: string, options: ToastOptions = {}) => {
    const variant = options.variant ?? "success";
    const item: ToastItem = {
      id: nextId.current++,
      title,
      description: options.description,
      variant,
      durationMs: options.durationMs ?? DEFAULT_DURATION_MS[variant],
    };
    setItems((list) => [...list, item].slice(-MAX_VISIBLE));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (title, description) => toast(title, { variant: "success", description }),
      info: (title, description) => toast(title, { variant: "info", description }),
      error: (title, description) => toast(title, { variant: "danger", description }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-space-4 bottom-space-4 z-(--z-overlay) flex flex-col items-end gap-y-space-2 sm:inset-x-auto sm:right-space-5 sm:bottom-space-5"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    const timer = setTimeout(onDismiss, item.durationMs);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // onDismiss is stable per item (closes over the id), the timer must
    // start exactly once — when the card mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="status"
      className={`pointer-events-auto w-full max-w-sm rounded-md border border-rule border-l-[3px] bg-paper px-space-4 py-space-3 shadow-depth-2 transition-[opacity,transform] duration-(--duration-base) ${VARIANT_CLASSES[item.variant]} ${
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-start gap-x-space-3">
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium text-ink">{item.title}</p>
          {item.description ? <p className="mt-space-1 text-body-sm text-ink-secondary">{item.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-space-1 -mt-space-1 rounded-sm px-space-2 py-space-1 text-body-sm text-ink-muted hover:bg-surface hover:text-ink"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/// The hook every CMS client component uses. Throws outside the provider
/// so a missing wrapper is a build-time surprise, not a silent no-op.
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast() must be used inside <ToastProvider>");
  return api;
}
