import Link from "next/link";
import { getCategories } from "@/lib/api/public";
import { SITE_NAME } from "@/lib/site";

/// docs/19 §2.4 — About · Contact · Editorial policy · Privacy · RSS, plus
/// (brief §23) the section list so the footer works as a second
/// navigation. No social links: none exist in the requirements, and a
/// footer that points at accounts that don't exist is worse than one that
/// doesn't. The tagline is a statement of the workflow (every story is
/// reviewed before publication — BR-02/BR-05), not a marketing claim.
export async function PublicFooter() {
  const categories = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="public-footer mt-space-9">
      <div className="mx-auto max-w-(--width-page-max) px-space-4 py-space-8 md:px-space-5">
        <div className="grid grid-cols-1 gap-y-space-7 md:grid-cols-12 md:gap-x-space-6">
          <div className="md:col-span-5">
            <p className="public-footer-wordmark">
              {SITE_NAME}<span className="text-brand" aria-hidden="true">.</span>
            </p>
            <p className="mt-space-4 max-w-[36ch] text-body text-paper/72">
              Every story is written by a reporter and reviewed by an editor before it is
              published. Nothing reaches this page unread.
            </p>
          </div>

          {categories.length > 0 ? (
            <nav aria-label="Sections" className="md:col-span-3">
              <p className="text-label text-paper/50">Sections</p>
              <ul className="mt-space-3 grid grid-cols-2 gap-y-space-2 md:grid-cols-1">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/${category.slug}`}
                      className="link-underline text-body-sm text-paper/76 hover:text-paper"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-label="Publication" className="md:col-span-2">
            <p className="text-label text-paper/50">Publication</p>
            <ul className="mt-space-3 space-y-space-2">
              <li>
                <Link href="/about" className="link-underline text-body-sm text-paper/76 hover:text-paper">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="link-underline text-body-sm text-paper/76 hover:text-paper">
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/editorial-policy"
                  className="link-underline text-body-sm text-paper/76 hover:text-paper"
                >
                  Editorial policy
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="More" className="md:col-span-2">
            <p className="text-label text-paper/50">More</p>
            <ul className="mt-space-3 space-y-space-2">
              <li>
                <Link href="/privacy" className="link-underline text-body-sm text-paper/76 hover:text-paper">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" className="link-underline text-body-sm text-paper/76 hover:text-paper">
                  RSS feed
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-space-7 flex flex-col gap-y-space-2 border-t border-paper/15 pt-space-4 text-caption text-paper/50 md:flex-row md:items-center md:justify-between">
          <span>
            © {year} {SITE_NAME}. All rights reserved.
          </span>
          <a href="#top" className="link-underline text-paper/60 hover:text-paper">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
