import type { ReactNode } from "react";
import { RevealRuntime } from "@/components/motion/RevealRuntime";

/** Keeps the Atlas Edition tokens inside reader-facing routes. */
export function PublicSite({ children }: { children: ReactNode }) {
  return (
    <div className="public-site">
      {children}
      <RevealRuntime />
    </div>
  );
}
