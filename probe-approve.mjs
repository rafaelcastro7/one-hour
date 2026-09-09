import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const env = Object.fromEntries(
  readFileSync(new URL("./.env.local", import.meta.url), "utf8")
    .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
const ADMIN_KEY = process.env.ADMIN_APPROVAL_KEY ?? env.ADMIN_APPROVAL_KEY;
if (!ADMIN_KEY) throw new Error("Set ADMIN_APPROVAL_KEY in the shell or .env.local before running probe-approve.");
const pending = await client.query(api.volunteers.pendingApproval, { adminKey: ADMIN_KEY });
console.log("pending count:", pending.length);
for (const v of pending.slice(0, 5)) {
  console.log(JSON.stringify({
    name: v.name, email: v.email,
    embeddingLen: v.embedding?.length ?? "missing",
    quizScore: v.quizScore ?? "missing",
    linkedinUrl: v.linkedinUrl ?? "missing",
    summary: (v.profileSummary ?? "").slice(0, 80),
  }));
  try {
    await client.mutation(api.volunteers.approve, { volunteerId: v._id, adminKey: ADMIN_KEY });
    console.log("  approve: OK");
  } catch (e) {
    console.log("  approve: THREW:", String(e?.message ?? e).slice(0, 300));
  }
}
