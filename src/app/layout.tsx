import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "KhataOne | WhatsApp-first GST workflow for CA firms",
  description:
    "KhataOne helps Indian CA firms turn WhatsApp invoices, receipts, PDFs, and client messages into draft entries, CA review queues, GST summaries, and exports.",
  openGraph: {
    title: "KhataOne | WhatsApp-first GST workflow for CA firms",
    description:
      "AI-assisted bookkeeping intake with draft extraction, human review, GST summaries, and exports for Indian CA firms.",
    siteName: "KhataOne",
    type: "website",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
