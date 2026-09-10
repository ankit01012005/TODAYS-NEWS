import Link from "next/link";
import { getCategories } from "@/lib/api/public";

/// docs/19 §2.4 — wordmark centred at xs, left at md+; masthead-colour rule
/// beneath; section nav below the rule, horizontally scrollable at xs, full
/// at md+, current section marked with a 2px ink underline.
///
/// docs/19 §2.4 / SEO-09 — no public-facing element ever links into the
/// back-office. There is deliberately no "staff sign-in" link here.
export async function PublicHeader({ activeCategorySlug }: { activeCategorySlug?: string } = {}) {
  const categories = await getCategories();

  return (
    <header>
      <div className="mx-auto flex max-w-(--width-page-max) items-center justify-center px-space-4 py-space-5 md:justify-start">
        <Link href="/" className="text-heading-2 text-ink no-underline">
          Today News
        </Link>
      </div>
      <div className="border-b-2 border-masthead" />
      {categories.length > 0 ? (
        <nav
          aria-label="Sections"
          className="mx-auto flex max-w-(--width-page-max) gap-x-space-5 overflow-x-auto border-b border-rule px-space-4 md:px-space-5"
        >
          {categories.map((category) => {
            const isActive = category.slug === activeCategorySlug;
            return (
              <Link
                key={category.slug}
                href={`/${category.slug}`}
                className={`shrink-0 border-b-2 py-space-3 text-body-sm no-underline transition-colors ${
                  isActive
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-secondary hover:text-ink"
                }`}
              >
                {category.name}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
