import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { getPublicAppUrl } from "@/lib/env";

import "./globals.css";

// Resolve the browser preference before paint without making every route dynamic.
const preferenceBootstrap = `(function(){var themeKey="khataone_theme",densityKey="khataone_table_density",media=window.matchMedia("(prefers-color-scheme: dark)");function apply(){var theme,density;try{theme=localStorage.getItem(themeKey);density=localStorage.getItem(densityKey)}catch{}document.documentElement.dataset.theme=theme==="dark"||theme==="system"&&media.matches?"dark":"light";document.documentElement.dataset.density=density==="compact"?"compact":"comfortable"}apply();media.addEventListener("change",apply);window.addEventListener("storage",function(event){if(event.key===themeKey||event.key===densityKey)apply()});window.addEventListener("khataone-preference-change",apply)})()`;

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootstrap }} />
      </head>
      <body
        className={`${manrope.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
