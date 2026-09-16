"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/// A picture that is unveiled rather than popped in: the frame wipes
/// open from the left while the image settles from a slight zoom, the
/// way a broadcast bumper reveals a still. For the front-page lead and
/// the dark heroes only — everything else uses the quieter CSS reveal.
export function ImageReveal({
  children,
  className = "",
  delay = 0,
  direction = "left",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "left" | "up";
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const from = direction === "left" ? "inset(0 100% 0 0)" : "inset(100% 0 0 0)";
  return (
    <motion.div
      className={className}
      initial={{ clipPath: from }}
      whileInView={{ clipPath: "inset(0 0 0 0)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.08 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
