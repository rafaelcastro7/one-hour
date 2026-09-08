"use client";

// Avatar for Aria, the AI volunteer. DiceBear serves deterministic SVG
// avatars over plain HTTPS: free, no key, no account, no tracking.
// "bottts-neutral" reads as a friendly robot; the seed pins Aria's face.
// Falls back to a local initial if the CDN is unreachable, so match cards
// never show a broken image.
import { useState } from "react";

export const ARIA_AVATAR_URL =
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Aria&backgroundColor=ffd54a";

export function AriaAvatar({ size = 48 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        role="img"
        aria-label="Aria, the AI volunteer"
        style={{ width: size, height: size }}
        className="rounded-full bg-amber-400 text-neutral-900 font-bold flex items-center justify-center shrink-0"
      >
        A
      </span>
    );
  }
  return (
    <img
      src={ARIA_AVATAR_URL}
      alt="Aria, the AI volunteer"
      width={size}
      height={size}
      className="rounded-full bg-neutral-800"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
