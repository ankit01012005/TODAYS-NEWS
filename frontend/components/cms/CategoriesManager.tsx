"use client";

import { FormEvent, useState } from "react";
import { CategoryView } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { TextField } from "./TextField";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/// PG-ADM-10. P2-21 — deactivating a section a live article still
/// references is refused server-side (a database trigger, docs/26); this
/// page just surfaces whatever message comes back, same as every other
/// refusal in the CMS.
export function CategoriesManager({ categories: initialCategories }: { categories: CategoryView[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!SLUG_PATTERN.test(slug)) {
      setError("Address must be lowercase letters, numbers and hyphens only");
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
      setName("");
      setSlug("");
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
    <div className="space-y-space-6">
      {error ? <Alert variant="danger" title={error} /> : null}

      <form onSubmit={handleCreate} className="max-w-md space-y-space-3 rounded-md border border-rule p-space-4">
        <h2 className="text-label text-ink-muted">Add a section</h2>
        <TextField id="category-name" label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          id="category-slug"
          label="Address"
          hint="Lowercase letters, numbers and hyphens"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <Button type="submit" variant="primary" loading={creating}>
          Add section
        </Button>
      </form>

      <div className="rounded-md border border-rule">
        {categories.length > 0 ? (
          categories.map((category) => (
            <CategoryRow key={category.id} category={category} onChanged={replace} onDeactivated={remove} />
          ))
        ) : (
          <p className="px-space-4 py-space-5 text-body-sm text-ink-muted">No sections yet.</p>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  onChanged,
  onDeactivated,
}: {
  category: CategoryView;
  onChanged: (category: CategoryView) => void;
  onDeactivated: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/categories/${category.id}/deactivate`, { method: "PATCH" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      onDeactivated(category.id);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-space-2 border-b border-rule px-space-4 py-space-3 last:border-b-0">
        {error ? <Alert variant="danger" title={error} /> : null}
        <TextField id={`edit-category-${category.id}`} label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-x-space-2">
          <Button type="button" variant="primary" size="sm" loading={busy} onClick={handleSave}>
            Save
          </Button>
          <Button type="button" variant="tertiary" size="sm" disabled={busy} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-space-4 gap-y-space-2 border-b border-rule px-space-4 py-space-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-body text-ink">{category.name}</p>
        <p className="text-meta text-ink-muted">/{category.slug}</p>
        {error ? <p className="mt-space-1 text-body-sm text-danger">{error}</p> : null}
      </div>
      <Button type="button" variant="tertiary" size="sm" disabled={busy} onClick={() => setEditing(true)}>
        Rename
      </Button>
      <ConfirmAction
        label="Deactivate"
        confirmLabel="Refused if a live article still uses this section."
        variant="destructive"
        loading={busy}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
