export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      {children}
    </div>
  );
} 