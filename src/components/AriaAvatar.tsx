// Avatar for Aria, the AI volunteer. DiceBear serves deterministic SVG
// avatars over plain HTTPS: free, no key, no account, no tracking.
// "bottts-neutral" reads as a friendly robot; the seed pins Aria's face.
export const ARIA_AVATAR_URL =
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Aria&backgroundColor=ffd54a";

export function AriaAvatar({ size = 48 }: { size?: number }) {
  return (
    <img
      src={ARIA_AVATAR_URL}
      alt="Aria, the AI volunteer"
      width={size}
      height={size}
      className="rounded-full bg-neutral-800"
      loading="lazy"
    />
  );
}
