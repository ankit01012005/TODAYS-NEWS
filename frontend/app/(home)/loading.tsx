import { HomeSkeleton } from "@/components/public/Skeletons";

/// Instant loading state for the homepage on client navigation (brief
/// §22) — the same shape as the page it stands in for.
export default function Loading() {
  return <HomeSkeleton />;
}
