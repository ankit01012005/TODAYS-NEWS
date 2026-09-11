"use client";

import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * The static sphere is server-rendered and stays usable as the fallback.
 * The canvas module is requested only when this section approaches the
 * viewport and the device has enough headroom for motion.
 */
export function AtlasGlobe() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [Canvas, setCanvas] = useState<ComponentType | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const constrained = (nav.hardwareConcurrency || 4) <= 2 || (nav.deviceMemory ?? 4) <= 2;
    if (reduceMotion || constrained) return;

    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    const load = () => {
      import("./AtlasGlobeCanvas").then((module) => {
        if (!cancelled) setCanvas(() => module.AtlasGlobeCanvas);
      }).catch(() => {
        // The server-rendered CSS sphere remains visible if the chunk fails.
      });
    };

    if (!("IntersectionObserver" in window) || !hostRef.current) {
      load();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          load();
        },
        { rootMargin: "360px" },
      );
      observer.observe(hostRef.current);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  return (
    <div ref={hostRef} className="atlas-globe" aria-hidden="true">
      <div className="atlas-globe-fallback">
        <span className="atlas-meridian" />
        <span className="atlas-latitude atlas-latitude-one" />
        <span className="atlas-latitude atlas-latitude-two" />
      </div>
      {Canvas ? <Canvas /> : null}
    </div>
  );
}
