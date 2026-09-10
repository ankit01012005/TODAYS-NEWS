"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { TextAreaField } from "./TextField";

/// PG-ADM-03 — "where publication happens." Three decisions, and three
/// only (docs/10 A-04): Approve & publish (confirmed — "the one place in
/// the product where a mis-click is publicly visible within seconds"),
/// Request changes (comment required — BR-07), Reject (reason required,
/// confirmed — BR-08). Deliberately no `publish`-variant Button exists
/// anywhere in this codebase (see Button.tsx) — "Approve & publish" is
/// this one screen's own primary action, not a shared component.
export function ArticleReviewActions({
  articleId,
  version,
  canApprove,
}: {
  articleId: string;
  version: number;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  async function handleApprove() {
    setError(null);
    setApproving(true);
    try {
      const res = await clientFetch(`/articles/${articleId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.push("/staff/review");
      router.refresh();
    } finally {
      setApproving(false);
    }
  }

  async function handleRequestChanges(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setRequestingChanges(true);
    try {
      const res = await clientFetch(`/articles/${articleId}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, comment }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.push("/staff/review");
      router.refresh();
    } finally {
      setRequestingChanges(false);
    }
  }

  async function handleReject() {
    setError(null);
    setRejecting(true);
    try {
      const res = await clientFetch(`/articles/${articleId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, reason }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.push("/staff/review");
      router.refresh();
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="mt-space-6 space-y-space-6 border-t border-rule pt-space-5">
      {error ? <Alert variant="danger" title={error} /> : null}

      {canApprove ? (
        <ConfirmAction
          label="Approve & publish"
          confirmLabel="This will go live immediately."
          variant="primary"
          loading={approving}
          onConfirm={handleApprove}
        />
      ) : (
        <Alert variant="info" title="You can't approve this story">
          You own it or last revised it (BR-13) — a different admin must approve or publish it.
        </Alert>
      )}

      <form onSubmit={handleRequestChanges} className="space-y-space-2">
        <TextAreaField
          label="Request changes — comment"
          hint="Sent to the editor; required"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button type="submit" variant="secondary" loading={requestingChanges} disabled={comment.trim().length === 0}>
          Request changes
        </Button>
      </form>

      <div className="space-y-space-2">
        <TextAreaField
          label="Reject — reason"
          hint="Sent to the editor; required"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <ConfirmAction
          label="Reject"
          confirmLabel="This tells the editor the story won't run."
          variant="destructive"
          loading={rejecting}
          disabled={reason.trim().length === 0}
          onConfirm={handleReject}
        />
      </div>
    </div>
  );
}
