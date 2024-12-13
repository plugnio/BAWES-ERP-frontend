import { LoginForm } from "@/components/auth/forms/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  searchParams: {
    verified?: string;
  };
}

export default async function LoginPage({ searchParams }: Props) {
  // Parse the verified param safely
  const params = await Promise.resolve(searchParams);
  const showVerifiedMessage = params?.verified === "true";

  return (
    <>
      {showVerifiedMessage && (
        <Alert className="w-[400px] mb-4">
          <AlertDescription>
            Email verified successfully! You can now login.
          </AlertDescription>
        </Alert>
      )}
      <LoginForm />
    </>
  );
} 