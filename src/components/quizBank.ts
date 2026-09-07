// Minimum-knowledge quiz for volunteers. Same bank is shown at registration
// and enforced at approval: at least QUIZ_PASS correct answers out of 3,
// plus a LinkedIn URL for identity. The resulting skill level travels with
// the profile so matching can weigh demonstrated knowledge, not just claims.

export type Category = "tech" | "languages";

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number; // index into options
};

export const QUIZ_PASS = 2;

export const QUIZZES: Record<Category, QuizQuestion[]> = {
  tech: [
    {
      q: "A user gets an HTTP 404 on a page that existed yesterday. What does 404 mean?",
      options: ["The server crashed", "Page not found", "No internet connection", "Wrong password"],
      answer: 1,
    },
    {
      q: "Which git command downloads new commits AND updates your current branch?",
      options: ["git fetch", "git pull", "git clone", "git status"],
      answer: 1,
    },
    {
      q: "Which SQL query returns the names of users older than 18?",
      options: [
        "SELECT name FROM users WHERE age > 18",
        "GET name WHERE users age > 18",
        "SELECT * users age > 18",
        "FIND name IN users IF age > 18",
      ],
      answer: 0,
    },
  ],
  languages: [
    {
      q: "A beginner keeps repeating the same mistake. What works best?",
      options: [
        "Stop correcting, only praise",
        "Correct every error on the spot",
        "Recast the sentence correctly and let them repeat it",
        "Switch to grammar tables",
      ],
      answer: 2,
    },
    {
      q: "In CEFR levels (A1 to C2), what comes right after B1?",
      options: ["A2", "B2", "C1", "A1"],
      answer: 1,
    },
    {
      q: "Your student cannot follow your instructions in their target language. Best move?",
      options: [
        "Repeat louder in the same language",
        "Drop the activity",
        "Simplify, gesture, and give one example",
        "Switch the whole session to theory",
      ],
      answer: 2,
    },
  ],
};

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export function levelFor(score: number): SkillLevel {
  if (score >= 3) return "advanced";
  if (score === QUIZ_PASS) return "intermediate";
  return "beginner";
}
