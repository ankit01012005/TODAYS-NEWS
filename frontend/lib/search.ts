import { getPublishedArticles } from "@/lib/api/public";
import { PublicArticleSummary } from "@/lib/api/public-types";

/// Reader search (2f) without a search endpoint. The API has no
/// GET /public/search yet (design handoff "Gaps": bodyPlain is ready for
/// a tsvector index, the route is a day's work); until it exists this
/// walks the public list — the same cached, "public"-tagged pages the
/// front page uses — and matches on headline, summary and byline. Bounded
/// to MAX_PAGES so a large archive can't turn one search into dozens of
/// round trips; the results page says when the archive was cut short.
const MAX_PAGES = 8;

export interface SearchResult {
  articles: PublicArticleSummary[];
  scanned: number;
  truncated: boolean;
}

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenise(query: string): string[] {
  return normalise(query).split(" ").filter((t) => t.length > 1);
}

export async function searchPublished(query: string): Promise<SearchResult> {
  const terms = tokenise(query);
  if (terms.length === 0) return { articles: [], scanned: 0, truncated: false };

  const all: PublicArticleSummary[] = [];
  let cursor: string | undefined;
  let pages = 0;
  let truncated = false;
  do {
    const page = await getPublishedArticles(cursor);
    all.push(...page.articles);
    pages += 1;
    cursor = page.nextCursor ?? undefined;
    if (cursor && pages >= MAX_PAGES) {
      truncated = true;
      break;
    }
  } while (cursor);

  const scored = all
    .map((article) => {
      const headline = normalise(article.headline);
      const summary = normalise(article.summary);
      const byline = normalise(article.byline);
      const section = normalise(article.category.name);
      let score = 0;
      for (const term of terms) {
        if (headline.includes(term)) score += 4;
        if (summary.includes(term)) score += 2;
        if (byline.includes(term)) score += 2;
        if (section.includes(term)) score += 1;
      }
      // Every term must appear somewhere — "flood relief" shouldn't match
      // an unrelated story about relief work.
      const haystack = `${headline} ${summary} ${byline} ${section}`;
      const allTerms = terms.every((term) => haystack.includes(term));
      return { article, score: allTerms ? score : 0 };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.article.publishedAt.localeCompare(a.article.publishedAt));

  return { articles: scored.map((entry) => entry.article), scanned: all.length, truncated };
}
