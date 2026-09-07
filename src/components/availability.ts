// Structured weekly availability. Slots are day×block ids like "mon-evening".
// Volunteers pick a one-click preset or customize the grid; requesters pick
// dated chips that resolve to the same ids, so matching can verify overlap
// instead of comparing free text.

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const BLOCKS = ["morning", "afternoon", "evening"] as const;

export type Day = (typeof DAYS)[number];
export type Block = (typeof BLOCKS)[number];
export type SlotId = `${Day}-${Block}`;

export const DAY_LABEL: Record<Day, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const BLOCK_LABEL: Record<Block, string> = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
};

export function slotLabel(slot: string): string {
  const [d, b] = slot.split("-");
  return `${DAY_LABEL[d as Day] ?? d} ${BLOCK_LABEL[b as Block] ?? b}`;
}

export type PresetId = "weekday-evenings" | "weekday-mornings" | "weekends" | "flexible";

export const PRESETS: Array<{ id: PresetId; label: string; slots: SlotId[] }> = [
  {
    id: "weekday-evenings",
    label: "Weekday evenings",
    slots: ["mon-evening", "tue-evening", "wed-evening", "thu-evening", "fri-evening"],
  },
  {
    id: "weekday-mornings",
    label: "Weekday mornings",
    slots: ["mon-morning", "tue-morning", "wed-morning", "thu-morning", "fri-morning"],
  },
  {
    id: "weekends",
    label: "Weekends",
    slots: [
      "sat-morning",
      "sat-afternoon",
      "sat-evening",
      "sun-morning",
      "sun-afternoon",
      "sun-evening",
    ],
  },
  {
    id: "flexible",
    label: "Flexible (anytime)",
    slots: DAYS.flatMap((d) => BLOCKS.map((b) => `${d}-${b}` as SlotId)),
  },
];

export function slotsOverlap(a: string[] | undefined, b: string[] | undefined): boolean {
  if (!a || !b || a.length === 0 || b.length === 0) return false;
  const set = new Set(a);
  return b.some((s) => set.has(s));
}

// Requester chips with real dates: labels show the actual weekday, values are
// the slot ids the matching overlap check runs on. Empty slots = ASAP.
export type RequestSlotOption = { label: string; slots: SlotId[] };

const JS_DAY_TO_DAY: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function requestSlotOptions(now = new Date()): RequestSlotOption[] {
  const today = JS_DAY_TO_DAY[now.getDay()];
  const tomorrow = JS_DAY_TO_DAY[(now.getDay() + 1) % 7];
  const weekend: SlotId[] = [
    "sat-morning",
    "sat-afternoon",
    "sat-evening",
    "sun-morning",
    "sun-afternoon",
    "sun-evening",
  ];
  return [
    { label: "As soon as possible", slots: [] },
    {
      label: `Today ${DAY_LABEL[today]} evening`,
      slots: [`${today}-evening` as SlotId],
    },
    {
      label: `Tomorrow ${DAY_LABEL[tomorrow]}`,
      slots: (["morning", "afternoon", "evening"] as Block[]).map(
        (b) => `${tomorrow}-${b}` as SlotId
      ),
    },
    { label: "This weekend", slots: weekend },
  ];
}

export function userTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "local time";
  } catch {
    return "local time";
  }
}
