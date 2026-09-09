import Link from "next/link";

/// docs/19 §2.4 — About · Contact · Editorial policy · Privacy · RSS.
/// Nothing else. The four static pages arrive in 5B; the links are wired
/// now so the footer's shape is right from the first real page, even
/// though following them 404s until 5B lands.
export function PublicFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto max-w-(--width-page-max) px-space-4 py-space-6 md:px-space-5">
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
          <Link href="/feed" className="text-body-sm text-ink-muted hover:text-ink">
            RSS
          </Link>
        </nav>
      </div>
    </footer>
  );
}
