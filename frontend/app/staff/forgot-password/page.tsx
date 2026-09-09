import type { Metadata } from "next";
import { AuthCard } from "@/components/cms/AuthCard";
import { ForgotPasswordForm } from "@/components/cms/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password — Today News", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
