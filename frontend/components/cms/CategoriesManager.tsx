"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { CategoryView } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { slugify } from "./NewArticleForm";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { ListFrame, PageHeader, Panel, CmsEmpty } from "./Panel";
import { TextField } from "./TextField";
import { useToast } from "./Toast";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/// 2o — "the URL space". Each section is a nav item and the first half of
/// every story's address. Two rules the UI carries: a section cannot be
/// retired while a live story sits in it (the database refuses — the
/// refusal is shown on the row with the API's reason); and renaming the
/// name is safe, but the slug is the URL, so it isn't editable here.
export function CategoriesManager({
  categories: initialCategories,
  liveCounts,
}: {
  categories: CategoryView[];
  /// Live stories per category slug, from the public list — so "24 live
  /// stories" and the retire warning are honest.
  liveCounts: Record<string, number>;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [adding, setAdding] = useState(initialCategories.length === 0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { success } = useToast();

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!SLUG_PATTERN.test(slug)) {
      setError("The address must be lowercase letters, numbers and hyphens only.");
      return;
    }
    setCreating(true);
    try {
      const res = await clientFetch("/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const created = (await res.json()) as CategoryView;
      setCategories((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
      success("Section added.", `${created.name} is in the nav and available to writers now.`);
      setName("");
      setSlug("");
      setSlugTouched(false);
      setAdding(false);
    } finally {
      setCreating(false);
    }
  }

  function replace(updated: CategoryView) {
    setCategories((list) => list.map((c) => (c.id === updated.id ? updated : c)));
  }
  function remove(id: string) {
    setCategories((list) => list.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-space-5">
      <PageHeader
        title="Sections"
        lede="Each one is a nav item and the first half of every story’s address."
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
            Add a section
          </Button>
        }
      />

      <AnimatePresence initial={false}>
        {adding ? (
          <motion.form
            onSubmit={handleCreate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-space-3 border border-ink bg-paper p-space-4">
              {error ? <Alert variant="danger" title={error} /> : null}
              <TextField
                id="category-name"
                label="Name"
                required
                autoFocus
                placeholder="India"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
              />
              <TextField
                id="category-slug"
                label="Address"
                hint="Lowercase letters, numbers and hyphens. Fixed once a story is published in it."
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
              />
              <div className="flex gap-x-space-2">
                <Button type="submit" variant="primary" loading={creating}>
                  Add section
                </Button>
                <Button type="button" variant="tertiary" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>

      <ListFrame>
        {categories.length > 0 ? (
          categories.map((category) => (
            <CategoryRow key={category.id} category={category} liveCount={liveCounts[category.slug] ?? 0} onChanged={replace} onRetired={remove} />
          ))
        ) : (
          <div className="p-space-4">
            <CmsEmpty title="No sections yet" body="A freshly migrated database has none. Add the first one and writers can start." />
          </div>
        )}
      </ListFrame>

      <Panel tone="gold" heading="Two rules the UI must carry">
        <p className="text-body-sm text-ink">
          A section cannot be retired while a live story sits in it — the database refuses, so the button is greyed and
          the row says how many stories are in the way. And renaming the <em>name</em> is safe; the slug is the URL, so
          changing it would break every published link in that section — it stays as it is.
        </p>
        <p className="mt-space-2 text-mono-sm text-gold-deep">retire = soft delete · nothing is ever hard-deleted here</p>
      </Panel>
    </div>
  );
}

function CategoryRow({
  category,
  liveCount,
  onChanged,
  onRetired,
}: {
  category: CategoryView;
  liveCount: number;
  onChanged: (category: CategoryView) => void;
  onRetired: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, info } = useToast();

  async function handleSave() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      onChanged((await res.json()) as CategoryView);
      setEditing(false);
      success("Section renamed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRetire() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/categories/${category.id}/deactivate`, { method: "PATCH" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      onRetired(category.id);
      info("Section retired.", `${category.name} no longer appears for writers or readers.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-space-3 gap-y-space-2 border-b border-rule px-space-4 py-space-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-wrap items-end gap-x-space-2 gap-y-space-2">
            <div className="min-w-[200px] flex-1">
              <TextField id={`edit-category-${category.id}`} label="Name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button type="button" variant="primary" size="sm" loading={busy} onClick={handleSave}>
              Save
            </Button>
            <Button type="button" variant="tertiary" size="sm" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <p className="text-heading-4 text-ink">{category.name}</p>
            <p className="mt-space-1 text-mono-sm text-ink-muted">
              /{category.slug} · {liveCount} live {liveCount === 1 ? "story" : "stories"}
            </p>
          </>
        )}
        {error ? <p className="mt-space-1 text-body-sm text-danger">{error}</p> : null}
      </div>
      {!editing ? (
        <>
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => setEditing(true)}>
            Rename
          </Button>
          {liveCount > 0 ? (
            <span className="inline-flex h-8 items-center border border-rule px-space-3 text-body-sm text-ink-faint" title={`${liveCount} live ${liveCount === 1 ? "story is" : "stories are"} in the way`}>
              Retire
            </span>
          ) : (
            <ConfirmAction
              label="Retire"
              confirmLabel={`Retire ${category.name}?`}
              detail="It leaves the nav and the writers’ section list. Refused if a live story still uses it."
              variant="tertiary"
              size="sm"
              loading={busy}
              onConfirm={handleRetire}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
