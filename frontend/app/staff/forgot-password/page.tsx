import type { Metadata } from "next";
import { AuthCard } from "@/components/cms/AuthCard";
import { ForgotPasswordForm } from "@/components/cms/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Newsroom" headline="Reset your password">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
