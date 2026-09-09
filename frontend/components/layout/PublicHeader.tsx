import Link from "next/link";

/// docs/19 §2.4 — wordmark centred at xs, left at md+; masthead-colour rule
/// beneath. Section nav is deferred: it needs the category list, which
/// isn't fetched anywhere yet in Phase 5A (only the homepage exists). It
/// arrives in 5B alongside the section pages it links to.
///
/// docs/19 §2.4 / SEO-09 — no public-facing element ever links into the
/// back-office. There is deliberately no "staff sign-in" link here.
export function PublicHeader() {
  return (
    <header className="border-b-2 border-masthead">
      <div className="mx-auto flex max-w-(--width-page-max) items-center justify-center px-space-4 py-space-5 md:justify-start">
        <Link href="/" className="text-heading-2 text-ink no-underline">
          Today News
        </Link>
      </div>
    </header>
  );
}
