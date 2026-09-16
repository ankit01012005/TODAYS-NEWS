"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

/// A number that counts up from zero the first time it scrolls into view
/// — the dashboard's state counts and the PR page's reach figures. The
/// count is a motion value written straight to the DOM (no React state
/// per frame). It renders the final value on the server and under
/// reduced motion, so nothing ever reads "0" by mistake.
export function CountUp({
  value,
  duration = 0.9,
  className = "",
  format = (n: number) => String(n),
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const count = useMotionValue(value);
  const text = useTransform(count, (latest) => format(Math.round(latest)));

  useEffect(() => {
    if (!inView) {
      count.set(value);
      return;
    }
    if (reduce || value === 0) {
      count.set(value);
      return;
    }
    count.set(0);
    const controls = animate(count, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, value, duration, reduce, count]);

  return (
    <motion.span ref={ref} className={className} aria-label={format(value)}>
      {text}
    </motion.span>
  );
}
