import { describe, expect, test } from "vitest";
import { normalizeLinkedIn } from "./linkedin";

// Registration lives or dies on this function: every LinkedIn input shape a
// user can paste must either canonicalize or reject loudly — never build a
// broken ".../in/https://..." profile link.

describe("normalizeLinkedIn", () => {
  test("bare username canonicalizes", () => {
    expect(normalizeLinkedIn("rafa")).toBe("https://www.linkedin.com/in/rafa");
  });

  test("full URL with query params extracts the username", () => {
    expect(normalizeLinkedIn("https://www.linkedin.com/in/rafa-castro-7?trk=profile")).toBe(
      "https://www.linkedin.com/in/rafa-castro-7"
    );
  });

  test("http without www also extracts", () => {
    expect(normalizeLinkedIn("http://linkedin.com/in/ANA-123")).toBe(
      "https://www.linkedin.com/in/ANA-123"
    );
  });

  test("surrounding whitespace is trimmed", () => {
    expect(normalizeLinkedIn("  rafa7  ")).toBe("https://www.linkedin.com/in/rafa7");
  });

  test("rejects too-short usernames", () => {
    expect(normalizeLinkedIn("ab")).toBeNull();
  });

  test("rejects inner spaces", () => {
    expect(normalizeLinkedIn("rafa castro")).toBeNull();
  });

  test("rejects non-LinkedIn URLs", () => {
    expect(normalizeLinkedIn("https://example.com/in/rafa")).toBeNull();
  });

  test("rejects empty input", () => {
    expect(normalizeLinkedIn("")).toBeNull();
    expect(normalizeLinkedIn("   ")).toBeNull();
  });

  test("rejects path traversal smuggled as username", () => {
    expect(normalizeLinkedIn("rafa/../admin")).toBeNull();
    expect(normalizeLinkedIn("linkedin.com/in/")).toBeNull();
  });

  test("minimum boundary of 3 chars passes", () => {
    expect(normalizeLinkedIn("abc")).toBe("https://www.linkedin.com/in/abc");
  });
});
