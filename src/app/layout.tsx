import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "./AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://onehour-vn98.onrender.com"),
  title: {
    default: "1hour — give an hour, get an hour",
    template: "%s · 1hour",
  },
  description:
    "1hour is an AI-matched volunteering hub: ask for or give an hour of your time. Conversational intake, semantic matching, real video call on confirm.",
  openGraph: {
    title: "1hour — give an hour, get an hour",
    description:
      "Conversational intake → semantic matching → real video call. Measured accuracy, latency and cost.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-50">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
