"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL. Set it to your Convex deployment URL.");
  }
  return new ConvexReactClient(url);
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getClient(), []);
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
