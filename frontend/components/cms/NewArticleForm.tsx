"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArticleDetailView, CategoryView } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { TextField } from "./TextField";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/// BR-15 — the address is a permanent public promise once first
/// published, set explicitly here rather than derived silently from the
/// headline. Resolves docs/09's "exists as DRAFT from the first save, not
/// page-open" intent against POST /articles' actual slug+category-
/// required contract (decided in 4C-2): a genuinely empty, nothing-chosen
/// editor is never written to the database.
export function NewArticleForm({ categories }: { categories: CategoryView[] }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!SLUG_PATTERN.test(slug)) {
      setError("Address must be lowercase letters, numbers and hyphens only");
      return;
    }
    setSubmitting(true);
    try {
      const res = await clientFetch("/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, categoryId }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const article = (await res.json()) as ArticleDetailView;
      router.push(`/staff/articles/${article.id}/edit`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-space-4">
      {error ? <Alert variant="danger" title={error} /> : null}
      <TextField
        id="slug"
        label="Address"
        hint="Lowercase letters, numbers and hyphens — this becomes the story's permanent URL"
        required
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />
      <div>
        <label htmlFor="categoryId" className="text-label text-ink-muted">
          Section
        </label>
        <select
          id="categoryId"
          className="mt-1 h-10 w-full rounded-sm border border-rule-strong px-space-3 text-body text-ink"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="primary" loading={submitting} disabled={!categoryId}>
        Create draft
      </Button>
    </form>
  );
}
