import { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

/// 1h — the centred white card on the Bone ground: the wordmark, a line
/// of context ("Newsroom sign-in"), and the form. Deliberately reveals
/// nothing about who works here — no sign-up link (invite-only, by
/// design), no list of users.
export function AuthCard({
  title,
  eyebrow,
  headline,
  children,
}: {
  /// The line under the wordmark ("Newsroom sign-in").
  title: string;
  /// Optional red uppercase kicker above a large headline
  /// ("YOU'VE BEEN INVITED" / "Welcome to the desk, Name.").
  eyebrow?: string;
  headline?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-space-4 py-space-8">
      <div className="w-full max-w-[360px]">
        <div className="enter-rise border border-rule-strong bg-paper px-space-5 py-space-6 shadow-depth-2">
          <div className="flex flex-col items-center">
            <Wordmark size="sm" drawPulse href="/" />
            <p className="mt-space-2 text-caption text-ink-muted">{title}</p>
          </div>
          {eyebrow || headline ? (
            <div className="mt-space-5">
              {eyebrow ? <p className="text-label text-brand">{eyebrow}</p> : null}
              {headline ? <h1 className="mt-space-2 text-heading-2 text-ink">{headline}</h1> : null}
            </div>
          ) : (
            <h1 className="sr-only">{title}</h1>
          )}
          <div className="mt-space-5">{children}</div>
        </div>
        <p className="mt-space-4 text-center text-mono-sm text-ink-faint">Staff access only · invitation required</p>
      </div>
    </div>
  );
}
