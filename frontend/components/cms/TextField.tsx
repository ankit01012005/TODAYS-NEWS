import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/// docs/19 §2.2 — label above (`label` style), 40px control, rule-strong
/// border, help/error text below in `meta`. Errors appear next to the
/// field, in danger, with text (not colour alone — A11Y-02's principle
/// applied to forms too).
interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextField({
  label,
  error,
  hint,
  optional,
  id,
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <FieldLabel label={label} optional={optional} htmlFor={id} />
      <input
        id={id}
        className={`h-10 w-full rounded-sm border bg-paper px-space-3 text-body text-ink transition-colors duration-(--duration-fast) hover:border-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-muted disabled:hover:border-rule-strong ${
          error ? "border-danger" : "border-rule-strong"
        }`}
        {...rest}
      />
      <FieldFooter error={error} hint={hint} />
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  optional,
  id,
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <FieldLabel label={label} optional={optional} htmlFor={id} />
      <textarea
        id={id}
        className={`w-full rounded-sm border bg-paper px-space-3 py-space-2 text-body text-ink transition-colors duration-(--duration-fast) hover:border-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-muted disabled:hover:border-rule-strong ${
          error ? "border-danger" : "border-rule-strong"
        }`}
        {...rest}
      />
      <FieldFooter error={error} hint={hint} />
    </div>
  );
}

function FieldLabel({ label, optional, htmlFor }: { label: string; optional?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-label text-ink-muted">
      {label}
      {optional ? " (optional)" : ""}
    </label>
  );
}

function FieldFooter({ error, hint }: { error?: string; hint?: string }) {
  if (error) {
    return <p className="mt-space-1 text-body-sm text-danger">{error}</p>;
  }
  if (hint) {
    return <p className="mt-space-1 text-meta text-ink-muted">{hint}</p>;
  }
  return null;
}
