import { AuthProvider } from '@/lib/auth/provider';

export default function SLABreachesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}