import type { ReactNode } from "react";
import { RevealRuntime } from "@/components/motion/RevealRuntime";

/// The reader-site wrapper: the Bone ground, and the scroll-reveal
/// runtime for server-rendered sections.
export function PublicSite({ children }: { children: ReactNode }) {
  return (
    <div className="public-site min-h-screen bg-surface text-ink">
      {children}
      <RevealRuntime />
    </div>
  );
}
