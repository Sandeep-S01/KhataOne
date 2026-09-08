import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";

import { getPublicAppUrl } from "@/lib/env";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAppUrl()),
  title: "KhataOne | WhatsApp-first GST workflow for CA firms",
  description:
    "KhataOne helps Indian CA firms turn WhatsApp invoices, receipts, PDFs, and client messages into draft entries, CA review queues, GST summaries, and exports.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "KhataOne | WhatsApp-first GST workflow for CA firms",
    description:
      "AI-assisted bookkeeping intake with draft extraction, human review, GST summaries, and exports for Indian CA firms.",
    url: "/",
    siteName: "KhataOne",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KhataOne | WhatsApp-first GST workflow for CA firms",
    description:
      "WhatsApp intake, AI draft extraction, CA review, GST summaries, and exports for Indian CA firms.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${manrope.variable} ${jetBrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
