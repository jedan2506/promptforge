import type { Metadata } from 'next';
import './globals.css';
import { config } from '@/config/env';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { SiteBackground } from '@/components/layout/SiteBackground';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: `${config.siteName} — ${config.siteTagline}`,
  description: config.siteTagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <SiteBackground />
          <Navbar />
          <main className="container_page py-8 min-h-[calc(100vh-3.5rem-5rem)]">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
