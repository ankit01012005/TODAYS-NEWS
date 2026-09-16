"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, readWriteFailure, WriteFailure } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { ConfirmAction } from "./ConfirmAction";
import { Panel } from "./Panel";
import { TextAreaField } from "./TextField";
import { useToast } from "./Toast";
import { SessionExpiredDialog, StaleVersionNotice } from "./WriteFailures";

/// 1l "YOUR DECISION" — one deliberate act. Three decisions, and three
/// only: Approve & publish (confirmed — the one place a mis-click is
/// publicly visible within seconds), Send back with notes (comment
/// required), Reject (reason required, confirmed). All three carry the
/// version the page loaded — a stale decision changes nothing and says so.
/// Deliberately no `publish`-variant Button exists anywhere in the
/// codebase; "Approve & publish" is this one panel's own primary action.
export function ArticleReviewActions({
  articleId,
  version,
  canApprove,
  sectionChanges,
}: {
  articleId: string;
  version: number;
  canApprove: boolean;
  sectionChanges: boolean;
}) {
  const router = useRouter();
  const { success, info } = useToast();
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const retryRef = useRef<(() => Promise<void>) | null>(null);

  async function decide(label: string, path: string, body: Record<string, unknown>, done: () => void) {
    setError(null);
    setStale(false);
    setBusy(label);
    try {
      const res = await clientFetch(`/articles/${articleId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const failure: WriteFailure = await readWriteFailure(res);
        if (failure.kind === "stale") setStale(true);
        else if (failure.kind === "signed-out") {
          retryRef.current = () => decide(label, path, body, done);
          setSessionExpired(true);
        } else setError(failure.message);
        return;
      }
      done();
      router.push("/staff/review");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel tone="ink" heading="Your decision" className="lg:sticky lg:top-[72px]">
      <div className="space-y-space-3">
        {stale ? <StaleVersionNotice loadedVersion={version} /> : null}
        {error ? <Alert variant="danger" title={error} /> : null}

        {canApprove ? (
          <ConfirmAction
            label="Approve & publish"
            confirmLabel="Publish this story now?"
            detail={
              sectionChanges
                ? "It goes live immediately — and because the section changed, the story moves to a new address."
                : "It goes live on the site immediately, with this version’s section and byline."
            }
            variant="primary"
            loading={busy === "approve"}
            yesLabel="Yes, publish"
            onConfirm={() => decide("approve", "approve", { version }, () => success("Published.", "The story is live on the site now."))}
          />
        ) : (
          <Alert variant="info" title="You can’t approve this one">
            You own it or last revised it — a different admin must approve or publish it.
          </Alert>
        )}

        <div className="border-t border-rule pt-space-3">
          <TextAreaField
            id="decision-comment"
            label="Send back with notes"
            labelNote="what should they change? required"
            rows={3}
            placeholder="Tighten the second paragraph and add the source you mentioned. Strong lead otherwise — nearly there."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="mt-space-2">
            <ConfirmAction
              label="Send back with notes"
              confirmLabel="Send it back to the editor?"
              detail="Your note goes with it. They can edit and resubmit."
              variant="gold"
              size="sm"
              loading={busy === "request-changes"}
              disabled={comment.trim().length === 0}
              yesLabel="Yes, send back"
              onConfirm={() =>
                decide("request-changes", "request-changes", { version, comment }, () =>
                  info("Sent back with notes.", "The story is with its editor again, with your note."),
                )
              }
            />
          </div>
        </div>

        <div className="border-t border-rule pt-space-3">
          <TextAreaField
            id="decision-reason"
            label="Reject"
            labelNote="reason required"
            rows={2}
            placeholder="Why the story won’t run."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-space-2">
            <ConfirmAction
              label="Reject"
              confirmLabel="Tell the editor this story won’t run?"
              detail="Only an admin can reopen a rejected story."
              variant="destructive"
              size="sm"
              loading={busy === "reject"}
              disabled={reason.trim().length === 0}
              yesLabel="Yes, reject"
              onConfirm={() => decide("reject", "reject", { version, reason }, () => info("Rejected.", "The editor has been told the story won’t run."))}
            />
          </div>
        </div>

        <p className="text-mono-sm text-ink-faint">approve = approve + publish in one call, with the version you loaded (v{version}) — a stale decision changes nothing</p>
      </div>

      <SessionExpiredDialog
        open={sessionExpired}
        onSignedIn={() => {
          setSessionExpired(false);
          const retry = retryRef.current;
          retryRef.current = null;
          if (retry) void retry();
        }}
      />
    </Panel>
  );
}
