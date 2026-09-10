import Link from "next/link";

/// docs/19 §2.4 — About · Contact · Editorial policy · Privacy · RSS.
/// Nothing else (content-wise — the sunken band and wordmark repeat below
/// are visual weight only, not new links, so the "nothing else" rule
/// still holds).
export function PublicFooter() {
  return (
    <footer className="border-t border-rule bg-surface-sunken">
      <div className="mx-auto flex max-w-(--width-page-max) flex-col gap-y-space-4 px-space-4 py-space-7 md:flex-row md:items-center md:justify-between md:px-space-5">
        <span className="text-heading-4 text-ink-muted">Today News</span>
        <nav className="flex flex-wrap gap-x-space-5 gap-y-space-2">
          <Link href="/about" className="text-body-sm text-ink-muted hover:text-ink">
            About
          </Link>
          <Link href="/contact" className="text-body-sm text-ink-muted hover:text-ink">
            Contact
          </Link>
          <Link href="/editorial-policy" className="text-body-sm text-ink-muted hover:text-ink">
            Editorial policy
          </Link>
          <Link href="/privacy" className="text-body-sm text-ink-muted hover:text-ink">
            Privacy
          </Link>
          <Link href="/feed.xml" className="text-body-sm text-ink-muted hover:text-ink">
            RSS
          </Link>
        </nav>
      </div>
    </footer>
  );
}
