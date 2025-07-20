import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rexera 2.0 - AI-Powered Real Estate Workflow Automation',
  description: 'Sophisticated AI-powered real estate workflow automation platform with human-in-the-loop oversight.',
  keywords: ['real estate', 'workflow automation', 'AI', 'municipal lien search', 'HOA acquisition', 'payoff request'],
  authors: [{ name: 'InspectHOA Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#64B6AC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}