import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'),
  title: "ZINC×NH - High-Impact Code Analysis",
  description: "Advanced, industrial-grade AI code analysis by Nilgiri House. Direct technical mentorship and high-speed logic reviews.",
  openGraph: {
    title: "ZINC×NH - High-Impact Code Analysis",
    description: "Instant code analysis, bug detection, and performance optimization.",
    images: [{ url: '/opengraph-image' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ZINC×NH - High-Impact Code Analysis",
    description: "Instant code analysis, bug detection, and performance optimization.",
    images: ['/twitter-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
