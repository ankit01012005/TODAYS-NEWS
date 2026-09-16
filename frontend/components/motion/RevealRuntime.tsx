"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/// Scroll reveal for server-rendered content. Prepares only elements that
/// are offscreen at hydration (`.reveal` → `.reveal-prepared`) and reveals
/// each one once as it enters the viewport. Content already in view is
/// never hidden, and without JavaScript, an observer, or with reduced
/// motion requested, nothing changes at all — the page is complete as
/// served. Re-runs per route so client navigations get the same treatment.
export function RevealRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.classList.add("reveal-visible");
          observer.unobserve(element);
        }
      },
      { rootMargin: "0px 0px -6%", threshold: 0.06 },
    );

    for (const element of elements) {
      if (element.getBoundingClientRect().top <= window.innerHeight * 0.98) {
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
