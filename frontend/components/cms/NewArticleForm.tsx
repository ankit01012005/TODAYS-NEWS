"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArticleDetailView, CategoryView } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Panel } from "./Panel";
import { SelectField, TextField } from "./TextField";
import { useToast } from "./Toast";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/// A working headline becomes the address automatically; the person can
/// still edit the address by hand, and once they do, typing in the
/// headline stops overwriting it.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/// 2j — "the one irreversible field". The address is a permanent public
/// promise once first published, set explicitly here rather than derived
/// silently. POST /articles takes slug, section and an optional byline;
/// the working headline is saved into the draft right after, so the
/// composer opens with it in place. A slug collision comes back from the
/// API and is shown inline on the address, not as a toast.
export function NewArticleForm({
  categories,
  defaultByline,
}: {
  categories: CategoryView[];
  defaultByline: string;
}) {
  const router = useRouter();
  const { success } = useToast();
  const [headline, setHeadline] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [byline, setByline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const category = useMemo(() => categories.find((c) => c.id === categoryId) ?? null, [categories, categoryId]);

  function onHeadline(value: string) {
    setHeadline(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSlugError(null);
    if (!SLUG_PATTERN.test(slug)) {
      setSlugError("Lowercase letters, numbers and hyphens only.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await clientFetch("/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, categoryId, ...(byline.trim() ? { bylineOverride: byline.trim() } : {}) }),
      });
      if (!res.ok) {
        const message = await readErrorMessage(res);
        if (res.status === 409 || /slug|address|already/i.test(message)) setSlugError(message);
        else setError(message);
        return;
      }
      const article = (await res.json()) as ArticleDetailView;
      // Put the working headline into the fresh draft so the composer
      // opens with it. A failure here isn't fatal — the draft exists.
      if (headline.trim() && article.openRevision) {
        await clientFetch(`/articles/${article.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: article.openRevision.version, headline: headline.trim() }),
        }).catch(() => undefined);
      }
      success("Draft opened", `/${category?.slug ?? ""}/${article.slug} is yours to write.`);
      router.push(`/staff/articles/${article.id}/edit`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[520px] space-y-space-4">
      {error ? <Alert variant="danger" title={error} /> : null}
      <TextField
        id="headline"
        label="Working headline"
        placeholder="Flood relief reaches the last village"
        autoFocus
        value={headline}
        onChange={(e) => onHeadline(e.target.value)}
      />
      <SelectField id="categoryId" label="Section" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>
      <TextField
        id="byline"
        label="Byline"
        placeholder={`${defaultByline} — leave as is, or override`}
        optional
        value={byline}
        onChange={(e) => setByline(e.target.value)}
      />

      <Panel tone="gold" heading="The address · choose carefully">
        <p className="text-mono text-ink">
          anvay.tv/{category?.slug ?? "section"}/
          <span className="inline-block border border-gold-deep bg-paper px-space-1">
            <label htmlFor="slug" className="sr-only">
              Address
            </label>
            <input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              placeholder="story-address"
              required
              spellCheck={false}
              aria-invalid={slugError ? true : undefined}
              className="min-w-[180px] bg-transparent text-mono text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </span>
        </p>
        {slugError ? (
          <p className="mt-space-2 text-body-sm text-danger" role="alert">
            {slugError}
          </p>
        ) : null}
        <p className="mt-space-2 text-body-sm text-gold-deep">
          Editable until the story is first published — after that it is fixed forever, so links never rot.
        </p>
      </Panel>

      <div className="flex flex-wrap gap-space-2">
        <Button type="submit" variant="primary" loading={submitting} loadingLabel="Opening…" disabled={!categoryId}>
          Create draft &amp; write
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
