"use client";

import ConvexClientProvider from "./ConvexClientProvider";
import { LanguageProvider } from "./language-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Client shell under the server RootLayout: owns the language preference,
// the Convex client, and the chrome (header/footer) so pages stay focused
// on their own content. Keeps hooks out of the server layout.
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ConvexClientProvider>
        <SiteHeader />
        {children}
        <SiteFooter />
      </ConvexClientProvider>
    </LanguageProvider>
  );
}
