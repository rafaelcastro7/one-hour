// Pure LinkedIn input normalization, shared by registration validation.
// Accepts a bare username ("rafa") or a full URL a user pasted
// ("https://www.linkedin.com/in/rafa?trk=profile"). Returns the canonical
// profile URL, or null when the input is not LinkedIn-shaped. Pure function:
// no I/O, fully unit-testable — the approval gate depends on it.

export function normalizeLinkedIn(raw: string): string | null {
  const input = raw.trim();
  if (input.length === 0) return null;
  const fromUrl = input.match(/linkedin\.com\/in\/([A-Za-z0-9-]{3,100})/i);
  const username = fromUrl?.[1] ?? (/^[A-Za-z0-9-]{3,100}$/.test(input) ? input : null);
  if (!username) return null;
  return `https://www.linkedin.com/in/${username}`;
}
