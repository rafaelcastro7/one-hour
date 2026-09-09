import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient("https://energized-retriever-599.convex.cloud");
const ADMIN_KEY = process.env.ADMIN_APPROVAL_KEY;
if (!ADMIN_KEY) throw new Error("Set ADMIN_APPROVAL_KEY in the shell before probing production.");
const pending = await client.query(api.volunteers.pendingApproval, { adminKey: ADMIN_KEY });
console.log("prod pending count:", pending.length);
for (const v of pending.slice(0, 8)) {
  console.log(JSON.stringify({
    name: v.name, email: v.email,
    embeddingLen: v.embedding?.length ?? "missing",
    quizScore: v.quizScore ?? "missing",
    linkedinUrl: v.linkedinUrl ? "present" : "missing",
    summary: (v.profileSummary ?? "").slice(0, 100),
  }));
}
