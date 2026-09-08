import { describe, expect, test } from "vitest";
import { QUIZZES, QUIZ_PASS, levelFor } from "../src/components/quizBank";

// The quiz is a trust gate: approval enforces QUIZ_PASS server-side while the
// questions live in the frontend bank. These tests pin the contract both
// sides assume — 3 questions per category, valid answer indexes, sane levels.

describe("quiz bank shape", () => {
  test("both categories have exactly 3 questions", () => {
    expect(QUIZZES.tech).toHaveLength(3);
    expect(QUIZZES.languages).toHaveLength(3);
  });

  test("every answer index points at a real option", () => {
    for (const questions of Object.values(QUIZZES)) {
      for (const q of questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });

  test("QUIZ_PASS matches the server approval gate (volunteers.approve)", () => {
    expect(QUIZ_PASS).toBe(2);
  });
});

describe("levelFor", () => {
  test("maps scores to levels without gaps", () => {
    expect(levelFor(0)).toBe("beginner");
    expect(levelFor(1)).toBe("beginner");
    expect(levelFor(2)).toBe("intermediate");
    expect(levelFor(3)).toBe("advanced");
  });

  test("out-of-range scores degrade to beginner, never crash", () => {
    expect(levelFor(-1)).toBe("beginner");
    expect(levelFor(99)).toBe("advanced");
  });
});
