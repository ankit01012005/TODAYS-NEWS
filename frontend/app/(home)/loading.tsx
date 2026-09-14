import { HomeSkeleton } from "@/components/public/Skeletons";

/// Instant loading state for the front page on client navigation — the
/// same shape as the page it stands in for (2h).
export default function Loading() {
  return <HomeSkeleton />;
}
