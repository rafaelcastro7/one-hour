import { describe, expect, test } from "vitest";
import {
  PRESET_LABEL_ES,
  PRESETS,
  requestSlotOptions,
  slotLabel,
  slotLabelEs,
  slotsOverlap,
  userTimeZone,
} from "../src/components/availability";

// Scheduling is load-bearing for matching: an empty or malformed slot set
// silently disables the availability bonus (or worse, blocks registration).
// These tests pin the invariants the rest of the system assumes.

describe("slotsOverlap", () => {
  test("detects a shared slot", () => {
    expect(slotsOverlap(["tue-evening"], ["tue-evening", "wed-morning"])).toBe(true);
  });

  test("no shared slot means no overlap", () => {
    expect(slotsOverlap(["tue-evening"], ["wed-morning"])).toBe(false);
  });

  test("empty or missing sets never overlap (ASAP-safe)", () => {
    expect(slotsOverlap([], ["tue-evening"])).toBe(false);
    expect(slotsOverlap(["tue-evening"], [])).toBe(false);
    expect(slotsOverlap(undefined, ["tue-evening"])).toBe(false);
    expect(slotsOverlap(["tue-evening"], undefined)).toBe(false);
    expect(slotsOverlap(undefined, undefined)).toBe(false);
  });
});

describe("requestSlotOptions", () => {
  test("always offers exactly 4 chips with ASAP first and empty", () => {
    const opts = requestSlotOptions(new Date("2026-09-08T12:00:00Z"));
    expect(opts).toHaveLength(4);
    expect(opts[0].label).toBe("As soon as possible");
    expect(opts[0].slots).toEqual([]);
  });

  test("today/tomorrow/weekend chips resolve to real slot ids", () => {
    const opts = requestSlotOptions(new Date("2026-09-08T12:00:00Z")); // a Tuesday
    expect(opts[1].slots).toEqual(["tue-evening"]);
    expect(opts[2].slots).toHaveLength(3);
    expect(opts[2].slots.every((s) => s.startsWith("wed-"))).toBe(true);
    expect(opts[3].slots).toHaveLength(6);
    expect(opts[3].slots.every((s) => s.startsWith("sat-") || s.startsWith("sun-"))).toBe(true);
  });

  test("weekend rollover works on Sundays", () => {
    const opts = requestSlotOptions(new Date("2026-09-13T12:00:00Z")); // a Sunday
    expect(opts[1].slots).toEqual(["sun-evening"]);
    expect(opts[2].slots.every((s) => s.startsWith("mon-"))).toBe(true);
  });
});

describe("slotLabel", () => {
  test("renders day + block", () => {
    expect(slotLabel("mon-evening")).toBe("Mon evening");
  });

  test("never throws on unknown ids", () => {
    expect(() => slotLabel("nonsense")).not.toThrow();
  });

  test("spanish variant renders translated labels", () => {
    expect(slotLabelEs("mon-evening")).toBe("Lun noche");
    expect(slotLabelEs("sat-morning")).toBe("Sáb mañana");
    expect(() => slotLabelEs("nonsense")).not.toThrow();
  });
});

describe("spanish labels", () => {
  test("every preset has a spanish label", () => {
    for (const p of PRESETS) {
      expect(PRESET_LABEL_ES[p.id].length).toBeGreaterThan(0);
    }
  });

  test("requestSlotOptions es renders translated chips with same slots", () => {
    const day = new Date("2026-09-08T12:00:00Z");
    const en = requestSlotOptions(day, "en");
    const es = requestSlotOptions(day, "es");
    expect(es).toHaveLength(en.length);
    expect(es[0].label).toBe("Lo antes posible");
    expect(es[0].slots).toEqual([]);
    for (let i = 0; i < en.length; i++) {
      expect(es[i].slots).toEqual(en[i].slots);
    }
  });
});

describe("userTimeZone", () => {
  test("always returns a non-empty string", () => {
    expect(userTimeZone().length).toBeGreaterThan(0);
  });
});
