"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Prepares only offscreen editorial cards, then reveals each one once.
 * Server-rendered content stays visible when JavaScript or the observer is
 * unavailable, and above-the-fold content is never hidden after hydration.
 */
export function RevealRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(".public-site .reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.classList.add("reveal-visible");
          observer.unobserve(element);
        }
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );

    for (const element of elements) {
      if (element.getBoundingClientRect().top <= window.innerHeight * 0.96) {
        element.classList.add("reveal-visible");
        continue;
      }
      element.classList.add("reveal-prepared");
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
