"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/// One place for framer-motion's global settings. `reducedMotion="user"`
/// makes every <motion.*> in the tree respect prefers-reduced-motion
/// automatically — transforms and opacity still snap to their end state,
/// they just don't animate. Mounted once in the root layout.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.36, ease: [0.25, 1, 0.5, 1] }}>
      {children}
    </MotionConfig>
  );
}
