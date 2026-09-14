"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Info, X } from "lucide-react";

/// 2t "Saved — toast": every successful write gets one; failures go
/// inline instead. Indigo Black cards with a green tick, bottom right,
/// rising in and out. The provider lives in the root layout, above every
/// route, so a toast raised just before router.push()/refresh() (sign-in
/// → dashboard, set-password → sign-in, submit → list) is still on
/// screen when the next page renders. Announced through aria-live.
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
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const GLYPH: Record<ToastVariant, ReactNode> = {
  success: <Check size={15} strokeWidth={2.5} className="text-success" aria-hidden="true" />,
  info: <Info size={15} className="text-gold" aria-hidden="true" />,
  danger: <AlertTriangle size={15} className="text-brand" aria-hidden="true" />,
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, item.durationMs);
    return () => clearTimeout(timer);
    // onDismiss is stable per item (closes over the id); the timer must
    // start exactly once — when the card mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      role="status"
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      className="band-dark pointer-events-auto w-full max-w-sm px-space-4 py-space-3 shadow-depth-2"
    >
      <div className="flex items-start gap-x-space-3">
        <span className="mt-[3px] shrink-0">{GLYPH[item.variant]}</span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium text-bone">{item.title}</p>
          {item.description ? <p className="mt-space-1 text-body-sm text-bone/70">{item.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-space-1 -mt-space-1 grid h-7 w-7 place-items-center text-bone/60 transition-colors hover:text-bone"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}

/// The hook every CMS client component uses. Throws outside the provider
/// so a missing wrapper is a build-time surprise, not a silent no-op.
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast() must be used inside <ToastProvider>");
  return api;
}
