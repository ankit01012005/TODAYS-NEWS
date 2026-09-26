import Link from "next/link";
import { PublicCategoryRef } from "@/lib/api/public-types";

/// The section nav beneath the masthead rule, sticky: Home, every
/// section from GET /public/categories, and PR & Distribution on the
/// right. ANVAY TV is deliberately NOT here — the masthead's LIVE pill is
/// the one route to /tv, where this nav used to name the same page a
/// second time, beneath a wordmark already saying it. The
/// 2px Sindoor underline grows from the left on hover and sits fully
/// under the current section. Horizontally scrollable at phone width
/// with faded edges (1g), full width at md+. A compact wordmark fades in
/// on the left once the masthead has scrolled away (CSS scroll timeline).
export function PrimaryNav({
  categories,
  activeCategorySlug,
  activeHome = false,
  activePath,
}: {
  categories: PublicCategoryRef[];
  activeCategorySlug?: string;
  activeHome?: boolean;
  activePath?: string;
}) {
  const linkClass = (active: boolean) =>
    `nav-link block whitespace-nowrap py-space-3 text-body-sm no-underline transition-colors duration-(--duration-fast) ${
      active ? "font-medium text-brand" : "text-ink hover:text-brand"
    }`;

  return (
    <nav
      aria-label="Sections"
      className="nav-elevate sticky top-0 z-(--z-nav) border-b border-rule bg-surface/92 backdrop-blur-md supports-[backdrop-filter]:bg-surface/85"
    >
      <div className="relative mx-auto flex max-w-(--width-page-max) items-center gap-x-space-4 px-space-4 md:px-space-6">
        <Link
          href="/"
          className="mini-wordmark text-wordmark absolute left-space-6 top-1/2 hidden -translate-y-1/2 items-end gap-x-[3px] text-[17px] text-ink no-underline lg:flex"
          tabIndex={-1}
          aria-hidden="true"
        >
          ANVAY<span className="text-[10px] text-brand">TV</span>
        </Link>
        <ul className="no-scrollbar fade-edges flex min-h-11 flex-1 items-center gap-x-space-5 overflow-x-auto md:gap-x-space-6 lg:pl-[92px]">
          <li className="shrink-0">
            <Link href="/" aria-current={activeHome ? "page" : undefined} className={linkClass(activeHome)}>
              Home
            </Link>
          </li>
          {categories.map((category) => {
            const isActive = category.slug === activeCategorySlug;
            return (
              <li key={category.slug} className="shrink-0">
                <Link
                  href={`/${category.slug}`}
                  aria-current={isActive ? "page" : undefined}
                  className={linkClass(isActive)}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
          <li className="hidden shrink-0 md:ml-auto md:block">
            <Link
              href="/pr"
              aria-current={activePath === "/pr" ? "page" : undefined}
              className={linkClass(activePath === "/pr")}
            >
              PR &amp; Distribution
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
