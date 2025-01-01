import { VerifyEmailForm } from "@/components/auth/verify-email-form";

interface SearchParams {
  email?: string;
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return <VerifyEmailForm />;
} 