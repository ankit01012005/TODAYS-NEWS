"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import type { PointerEvent, ReactNode } from "react";

/// A soft Haldi Gold glow that follows the pointer across a dark band —
/// the PR and ANVAY TV heroes. Gold is only ever a highlight on dark
/// surfaces, which is exactly what this is. Pure transform/opacity work
/// on a single layer; inert on touch (there is no pointer to follow) and
/// under reduced motion the layer simply stays put.
export function Spotlight({
  children,
  className = "",
  color = "rgba(232, 163, 61, 0.14)",
  size = 620,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  size?: number;
}) {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 120, damping: 24, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 24, mass: 0.6 });
  const background = useMotionTemplate`radial-gradient(${size}px circle at ${sx}px ${sy}px, ${color}, transparent 42%)`;

  function move(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  }

  return (
    <div className={`group/spot relative overflow-hidden ${className}`} onPointerMove={move}>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/spot:opacity-100"
        style={{ background }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
