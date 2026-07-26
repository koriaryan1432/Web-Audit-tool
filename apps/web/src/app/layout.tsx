import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
