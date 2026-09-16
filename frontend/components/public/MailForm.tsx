"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

/// The public site's forms — 2c "Send a message" and 1f "Pitch us" —
/// have no endpoint today (design handoff "Gaps" 3). Each one composes
/// an email instead: the fields become the subject and body of a mailto:
/// link the browser opens in the reader's own mail app. Nothing is
/// posted anywhere, so there is nothing to rate-limit or store.
export interface MailFormField {
  name: string;
  label: string;
  type?: "text" | "email" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export function MailForm({
  to,
  subjectPrefix,
  fields,
  submitLabel = "Send",
  note,
  heading,
}: {
  to: string;
  subjectPrefix: string;
  fields: MailFormField[];
  submitLabel?: string;
  note?: string;
  heading: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [opened, setOpened] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const subjectField = fields.find((f) => f.type === "select");
    const subject = `${subjectPrefix}${subjectField && values[subjectField.name] ? ` — ${values[subjectField.name]}` : ""}`;
    const body = fields
      .filter((f) => f.type !== "select")
      .map((f) => `${f.label}: ${values[f.name] ?? ""}`)
      .join("\n\n");
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  const inputClass =
    "w-full border border-rule-strong bg-paper px-space-3 text-body text-ink placeholder:text-ink-faint transition-colors duration-(--duration-fast) hover:border-ink-faint focus-visible:border-ink focus-visible:outline-none";

  return (
    <form onSubmit={handleSubmit} className="border border-rule bg-surface-sunken p-space-4 md:p-space-5">
      <h2 className="text-label-lg text-ink">{heading}</h2>
      <div className="mt-space-3 grid grid-cols-1 gap-space-2 sm:grid-cols-2">
        {fields.map((field) => {
          const wide = field.type === "textarea" || field.type === "select";
          const common = {
            id: `mf-${field.name}`,
            name: field.name,
            required: field.required,
            value: values[field.name] ?? "",
            onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field.name]: e.target.value })),
          };
          return (
            <div key={field.name} className={wide ? "sm:col-span-2" : ""}>
              <label htmlFor={common.id} className="sr-only">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea {...common} rows={4} placeholder={field.placeholder ?? field.label} className={`${inputClass} py-space-2`} />
              ) : field.type === "select" ? (
                <select {...common} className={`${inputClass} h-10`}>
                  <option value="">{field.placeholder ?? field.label}</option>
                  {(field.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input {...common} type={field.type ?? "text"} placeholder={field.placeholder ?? field.label} className={`${inputClass} h-10`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-space-3 flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-x-space-2 bg-brand px-space-4 text-body-sm font-medium text-paper transition-colors duration-(--duration-fast) hover:bg-brand-deep active:translate-y-px"
        >
          <Send size={14} aria-hidden="true" />
          {submitLabel}
        </button>
        <p className="text-mono-sm text-ink-muted" aria-live="polite">
          {opened ? `Opened in your mail app — addressed to ${to}.` : (note ?? `Opens in your mail app, addressed to ${to}.`)}
        </p>
      </div>
    </form>
  );
}
