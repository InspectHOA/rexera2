'use client';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SupabaseProvider } from '@/lib/supabase/provider';
import { AuthProvider } from '@/lib/auth/provider';
import { ThemeProvider } from '@/components/theme-provider';
import { TRPCProvider } from '@/lib/trpc/provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <SupabaseProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SupabaseProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </TRPCProvider>
  );
}