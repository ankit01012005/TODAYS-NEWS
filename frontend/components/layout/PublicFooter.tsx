import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { SocialGlyph } from "@/components/brand/SocialGlyph";
import { getCategories } from "@/lib/api/public";
import { SITE_NAME, SOCIAL_HANDLES } from "@/lib/site";

const ANVAY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/editorial-policy", label: "Editorial policy" },
  { href: "/contact", label: "Contact" },
  { href: "/pr", label: "PR & Distribution" },
  { href: "/tv", label: "ANVAY TV" },
  { href: "/privacy", label: "Privacy" },
];

/// 2e — the navigation floor: a 3px red rule over Indigo Black, the
/// wordmark with its pulse, and three columns (Sections · Anvay ·
/// Follow). Every link here resolves to a page in the site map — the
/// footer is the contract. The one staff link is nofollow and the CMS is
/// disallowed in robots.ts.
export async function PublicFooter() {
  const categories = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="band-dark mt-space-9 border-t-[3px] border-brand">
      <div className="mx-auto max-w-(--width-page-max) px-space-4 py-space-7 md:px-space-6 md:py-space-8">
        <div className="grid grid-cols-1 gap-y-space-7 md:grid-cols-12 md:gap-x-space-6">
          <div className="md:col-span-5">
            <Wordmark size="lg" tone="bone" href={null} beatPulse />
            <p className="mt-space-4 max-w-[38ch] text-body text-bone/70">
              Every story is written by a reporter and reviewed by an editor before it is published.
              Nothing reaches this page unread.
            </p>
          </div>

          {categories.length > 0 ? (
            <nav aria-label="Sections" className="md:col-span-2">
              <p className="text-label text-gold">Sections</p>
              <ul className="mt-space-3 grid grid-cols-2 gap-y-space-2 md:grid-cols-1">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/${category.slug}`} className="link-underline text-body-sm text-bone/78 hover:text-bone">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-label="Anvay" className="md:col-span-3">
            <p className="text-label text-gold">Anvay</p>
            <ul className="mt-space-3 grid grid-cols-2 gap-y-space-2 md:grid-cols-1">
              {ANVAY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-underline text-body-sm text-bone/78 hover:text-bone">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Follow" className="md:col-span-2">
            <p className="text-label text-gold">Follow</p>
            <ul className="mt-space-3 space-y-space-2">
              {SOCIAL_HANDLES.map((handle) => (
                <li key={handle.key}>
                  <a
                    href={handle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline inline-flex items-center gap-x-space-2 text-body-sm text-bone/78 hover:text-bone"
                  >
                    <SocialGlyph platform={handle.key} size={13} />
                    {handle.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
              <li>
                <Link href="/feed.xml" className="link-underline inline-flex items-center gap-x-space-2 text-body-sm text-bone/78 hover:text-bone">
                  <SocialGlyph platform="rss" size={13} />
                  RSS
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-space-7 flex flex-col gap-y-space-2 border-t border-bone/15 pt-space-4 text-mono-sm text-bone/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} {SITE_NAME}</span>
          <div className="flex items-center gap-x-space-5">
            <a href="#top" className="link-underline hover:text-bone">
              Back to top
            </a>
            <Link href="/staff/sign-in" rel="nofollow" className="link-underline hover:text-bone">
              Staff sign-in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
