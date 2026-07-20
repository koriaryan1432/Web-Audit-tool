import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SiteGrade — Know your score. Fix what matters.",
  description:
    "Website Performance & UX Audit SaaS. Get instant, AI-powered audit reports across Performance, SEO, Accessibility, Security, UX, and Best Practices.",
  keywords: ["website audit", "performance", "SEO", "accessibility", "Lighthouse"],
  openGraph: {
    title: "SiteGrade",
    description: "Know your score. Fix what matters.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
