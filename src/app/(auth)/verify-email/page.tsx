import { VerifyEmailForm } from "@/components/auth/forms/verify-email-form";

interface SearchParams {
  email?: string;
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return <VerifyEmailForm defaultEmail={searchParams.email} />;
} 