import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'SiteGrade — Website Audit Tool',
    template: '%s | SiteGrade',
  },
  description:
    'Know your score. Fix what matters. Instant website performance, accessibility, SEO, and best-practices audits with AI-powered recommendations.',
  keywords: ['website audit', 'performance', 'accessibility', 'SEO', 'Lighthouse'],
  openGraph: {
    title: 'SiteGrade',
    description: 'Know your score. Fix what matters.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
