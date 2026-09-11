"use client";

import { ReactNode, useEffect, useRef } from "react";

/// Brief §16 — a few degrees of perspective that follow the cursor, with
/// an inner `.tilt-layer` (the image) drifting a few pixels the other way
/// so the card reads as two planes. Everything visual lives in CSS
/// (globals.css `.tilt`); this only writes four custom properties on
/// pointer move, throttled to one write per frame. Inert on touch/coarse
/// pointers and under reduced motion, so mobile pays nothing (brief §20).
export function TiltCard({
  children,
  className = "",
  maxDegrees = 2.5,
  shift = 6,
}: {
  children: ReactNode;
  className?: string;
  maxDegrees?: number;
  shift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const enabled = useRef(false);

  useEffect(() => {
    enabled.current = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    ).matches;
    return () => cancelAnimationFrame(frame.current);
  }, []);

  function reset() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tx", "0px");
    el.style.setProperty("--ty", "0px");
    el.dataset.tilting = "false";
  }

  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={(event) => {
        if (!enabled.current) return;
        const el = ref.current;
        if (!el) return;
        const { clientX, clientY } = event;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const px = (clientX - rect.left) / rect.width - 0.5;
          const py = (clientY - rect.top) / rect.height - 0.5;
          el.style.setProperty("--ry", `${(px * maxDegrees * 2).toFixed(2)}deg`);
          el.style.setProperty("--rx", `${(-py * maxDegrees * 2).toFixed(2)}deg`);
          el.style.setProperty("--tx", `${(-px * shift).toFixed(1)}px`);
          el.style.setProperty("--ty", `${(-py * shift).toFixed(1)}px`);
          el.dataset.tilting = "true";
        });
      }}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      {children}
    </div>
  );
}
