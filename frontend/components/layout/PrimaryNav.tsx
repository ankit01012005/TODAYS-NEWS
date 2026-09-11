import Link from "next/link";
import { PublicCategoryRef } from "@/lib/api/public-types";
import { SITE_NAME } from "@/lib/site";

/// Brief §3/§18 — the section nav, sticky beneath the masthead, with an
/// underline that grows from the left on hover and sits fully under the
/// current section (docs/19 §2.4: current section marked with a 2px ink
/// underline). Horizontally scrollable at xs with faded edges (brief §20),
/// full width at md+. A compact wordmark fades in on the left once the
/// masthead has scrolled away (CSS scroll timeline — see globals.css).
export function PrimaryNav({
  categories,
  activeCategorySlug,
  activeHome = false,
}: {
  categories: PublicCategoryRef[];
  activeCategorySlug?: string;
  activeHome?: boolean;
}) {
  return (
    <nav
      aria-label="Sections"
      className="sticky top-0 z-(--z-nav) border-b border-rule bg-paper/92 backdrop-blur-md supports-[backdrop-filter]:bg-paper/85"
    >
      <div className="relative mx-auto flex max-w-(--width-page-max) items-center px-space-4 md:px-space-5">
        <Link
          href="/"
          className="mini-wordmark text-wordmark absolute left-space-5 top-1/2 hidden -translate-y-1/2 text-[22px] text-ink no-underline md:block"
          tabIndex={-1}
          aria-hidden="true"
        >
          {SITE_NAME}
          <span className="text-brand">.</span>
        </Link>
        <ul className="no-scrollbar fade-edges flex min-h-11 flex-1 items-center gap-x-space-5 overflow-x-auto md:justify-center md:gap-x-space-7 md:[mask-image:none]">
          <li className="shrink-0">
            <Link
              href="/"
              aria-current={activeHome ? "page" : undefined}
              className={`nav-link block py-space-3 text-body-sm font-medium no-underline transition-colors duration-(--duration-fast) ${
                activeHome ? "text-brand" : "text-ink-secondary hover:text-ink"
              }`}
            >
              Front page
            </Link>
          </li>
          {categories.map((category) => {
            const isActive = category.slug === activeCategorySlug;
            return (
              <li key={category.slug} className="shrink-0">
                <Link
                  href={`/${category.slug}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`nav-link block py-space-3 text-body-sm font-medium no-underline transition-colors duration-(--duration-fast) ${
                    isActive ? "text-brand" : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
