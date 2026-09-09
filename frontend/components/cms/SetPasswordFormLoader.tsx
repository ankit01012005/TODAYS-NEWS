"use client";

import { useSearchParams } from "next/navigation";
import { SetPasswordForm } from "./SetPasswordForm";

/// Splits the useSearchParams() read from SetPasswordForm's actual logic
/// so the Suspense boundary in the page wraps only what needs it.
export function SetPasswordFormLoader() {
  const searchParams = useSearchParams();
  return <SetPasswordForm token={searchParams.get("token")} />;
}
