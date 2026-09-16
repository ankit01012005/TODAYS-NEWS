import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/// Form fields — label above in the uppercase `label` style, a 40px
/// control on the soft CMS ground with a rule-strong border that turns
/// ink on focus, help/error text below. Errors appear next to the field,
/// in red, with text — never colour alone.
interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  /// A note rendered inline after the label, in the same muted colour
  /// ("· one or two sentences").
  labelNote?: string;
  /// Hide the label visually (still announced) — for search boxes and
  /// one-field forms whose placeholder is the label.
  hideLabel?: boolean;
}

export const FIELD_CLASS =
  "w-full border bg-surface-soft px-space-3 text-body text-ink placeholder:text-ink-faint transition-colors duration-(--duration-fast) hover:border-ink-faint focus-visible:border-ink focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-muted disabled:hover:border-rule-strong";

export function TextField({
  label,
  error,
  hint,
  optional,
  labelNote,
  hideLabel,
  id,
  className = "",
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <FieldLabel label={label} optional={optional} note={labelNote} htmlFor={id} hidden={hideLabel} />
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`h-10 ${FIELD_CLASS} ${error ? "border-danger" : "border-rule-strong"} ${hideLabel ? "" : "mt-space-1"} ${className}`}
        {...rest}
      />
      <FieldFooter id={id} error={error} hint={hint} />
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  optional,
  labelNote,
  hideLabel,
  id,
  className = "",
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <FieldLabel label={label} optional={optional} note={labelNote} htmlFor={id} hidden={hideLabel} />
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`py-space-2 ${FIELD_CLASS} ${error ? "border-danger" : "border-rule-strong"} ${hideLabel ? "" : "mt-space-1"} ${className}`}
        {...rest}
      />
      <FieldFooter id={id} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({
  label,
  error,
  hint,
  optional,
  labelNote,
  hideLabel,
  id,
  className = "",
  children,
  ...rest
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div>
      <FieldLabel label={label} optional={optional} note={labelNote} htmlFor={id} hidden={hideLabel} />
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={`h-10 ${FIELD_CLASS} ${error ? "border-danger" : "border-rule-strong"} ${hideLabel ? "" : "mt-space-1"} ${className}`}
        {...rest}
      >
        {children}
      </select>
      <FieldFooter id={id} error={error} hint={hint} />
    </div>
  );
}

export function FieldLabel({
  label,
  optional,
  note,
  htmlFor,
  hidden,
}: {
  label: string;
  optional?: boolean;
  note?: string;
  htmlFor?: string;
  hidden?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={hidden ? "sr-only" : "block text-label text-ink-muted"}>
      {label}
      {optional ? <span className="normal-case tracking-normal"> (optional)</span> : ""}
      {note ? <span className="ml-space-1 normal-case tracking-normal text-ink-faint">· {note}</span> : null}
    </label>
  );
}

function FieldFooter({ id, error, hint }: { id?: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={id ? `${id}-error` : undefined} className="mt-space-1 text-body-sm text-danger" role="alert">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id ? `${id}-hint` : undefined} className="mt-space-1 text-caption text-ink-muted">
        {hint}
      </p>
    );
  }
  return null;
}
