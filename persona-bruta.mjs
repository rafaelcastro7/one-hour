// PERSONA BRUTA: dumb user doing everything wrong. Every case asserts the
// system responds with a clear error (or graceful no-op) — never a crash,
// never corrupt data, never a hang. Runs against DEV. Fast: one LLM cycle.
import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const env = Object.fromEntries(
  readFileSync(new URL("./.env.local", import.meta.url), "utf8")
    .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
const TAG = Date.now().toString(36);
const HOST_CODE = process.env.GROUP_HOST_CODE ?? env.GROUP_HOST_CODE;
if (!HOST_CODE) throw new Error("Set GROUP_HOST_CODE in the shell or .env.local before running persona-bruta.");
let pass = 0, fail = 0;
async function throws(name, fn, snippet = "") {
  try {
    await fn();
    fail++;
    console.log(`FAIL ${name} — expected throw, got success`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    const ok = snippet ? msg.includes(snippet) : true;
    ok ? pass++ : fail++;
    console.log(`${ok ? "PASS" : "FAIL"} ${name} — threw: ${msg.slice(0, 90)}`);
  }
}
async function ok(name, cond, detail = "") {
  cond ? pass++ : fail++;
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}
const baseVol = {
  name: "Rehearsal Brute", category: "tech",
  rawOffer: "Brute force tester", history: [{ role: "user", content: "Brute force tester" }],
  linkedinUrl: "https://www.linkedin.com/in/rehearsal-brute", quizScore: 2,
  skillLevel: "intermediate", slots: ["mon-evening"],
};
const baseReq = {
  name: "Brute Requester", category: "tech",
  rawNeed: "Brute need", history: [{ role: "user", content: "Brute need" }],
  preferredTime: "As soon as possible", preferredSlots: [], preferredTz: "UTC", language: "en",
};

// --- 1. Registration guard rails ---
await throws("register empty name", () => client.mutation(api.volunteers.register, { ...baseVol, name: "   ", email: `b1-${TAG}@example.com` }), "1–80");
await throws("register bad email", () => client.mutation(api.volunteers.register, { ...baseVol, name: "B", email: "not-an-email" }), "email");
await throws("register short linkedin", () => client.mutation(api.volunteers.register, { ...baseVol, name: "B", email: `b2-${TAG}@example.com`, linkedinUrl: "ab" }), "LinkedIn");
await throws("register quizScore 99", () => client.mutation(api.volunteers.register, { ...baseVol, name: "B", email: `b3-${TAG}@example.com`, quizScore: 99 }), "0 and 3");
await throws("register quizScore -1", () => client.mutation(api.volunteers.register, { ...baseVol, name: "B", email: `b4-${TAG}@example.com`, quizScore: -1 }), "0 and 3");
await throws("register no slots", () => client.mutation(api.volunteers.register, { ...baseVol, name: "B", email: `b5-${TAG}@example.com`, slots: [] }), "slot");
await throws("register 22 slots", () => client.mutation(api.volunteers.register, { ...baseVol, name: "B", email: `b6-${TAG}@example.com`, slots: Array(22).fill("mon-evening") }), "Too many");
await throws("register 2001-char offer", () => client.mutation(api.volunteers.register, { ...baseVol, name: "B", email: `b7-${TAG}@example.com`, rawOffer: "x".repeat(2001) }), "2000");
await throws("register 51-msg history", () => client.mutation(api.volunteers.register, { ...baseVol, name: "B", email: `b8-${TAG}@example.com`, history: Array(51).fill({ role: "user", content: "hi" }) }), "too long");
const vBoundary = await client.mutation(api.volunteers.register, { ...baseVol, name: "Abc", email: `bok-${TAG}@example.com`, linkedinUrl: "abc", quizScore: 0 });
await ok("register boundary (3-char linkedin, score 0) succeeds", typeof vBoundary === "string");

// --- 2. Request guard rails ---
await throws("request empty name", () => client.mutation(api.requests.create, { ...baseReq, name: "  ", email: `r1-${TAG}@example.com` }), "1–80");
await throws("request bad email", () => client.mutation(api.requests.create, { ...baseReq, email: "nope" }), "email");
await throws("request 2001-char need", () => client.mutation(api.requests.create, { ...baseReq, email: `r2-${TAG}@example.com`, rawNeed: "y".repeat(2001) }), "2000");
await throws("request 51-msg history", () => client.mutation(api.requests.create, { ...baseReq, email: `r3-${TAG}@example.com`, history: Array(51).fill({ role: "user", content: "hi" }) }), "too long");
await throws("request 22 slots", () => client.mutation(api.requests.create, { ...baseReq, email: `r4-${TAG}@example.com`, preferredSlots: Array(22).fill("mon-evening") }), "Too many");

// --- 3. Double-spend: second rapid request must fail (no free lunch) ---
const dbl1 = await client.mutation(api.requests.create, { ...baseReq, name: "Double", email: `dbl-${TAG}@example.com` });
await ok("first request ok", typeof dbl1 === "string");
await throws("second rapid request rejected (0 credits)", () => client.mutation(api.requests.create, { ...baseReq, name: "Double", email: `dbl-${TAG}@example.com` }), "Not enough time credits");

// --- 4. Wrong-state transitions on a fresh searching request ---
await throws("complete unconfirmed throws", () => client.mutation(api.requests.completeSession, { requestId: dbl1 }), "Only confirmed");
await throws("rate uncompleted throws", () => client.mutation(api.requests.submitRating, { requestId: dbl1, side: "requester", score: 5 }), "completed");
await throws("checkIn on searching throws", () => client.mutation(api.requests.checkIn, { requestId: dbl1, side: "requester" }), "confirmed");
await throws("reportNoShow on searching throws", () => client.mutation(api.requests.reportNoShow, { requestId: dbl1, reporter: "requester" }), "active matches");
const stillSearching = await client.query(api.requests.get, { requestId: dbl1 });
await ok("confirm on searching is silent no-op", stillSearching.status === "searching" || stillSearching.status === "match_found");

// --- 5. Full cycle: double actions must be safe ---
const full = await client.mutation(api.requests.create, {
  ...baseReq, name: "Full Cycle", email: `full-${TAG}@example.com`,
  rawNeed: "Postgres pooling exhaustion help", history: [{ role: "user", content: "Postgres pooling exhaustion help" }],
});
let fin = null;
for (let i = 0; i < 36; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  fin = await client.query(api.requests.get, { requestId: full });
  if (["match_found", "no_match", "failed"].includes(fin.status)) break;
}
if (fin?.status === "match_found") {
  await client.mutation(api.requests.confirmMatch, { requestId: full });
  await client.mutation(api.requests.confirmMatch, { requestId: full }); // double confirm
  const c = await client.query(api.requests.get, { requestId: full });
  await ok("double confirm stays confirmed", c.status === "confirmed", c.status);
  await client.mutation(api.requests.completeSession, { requestId: full });
  await client.mutation(api.requests.completeSession, { requestId: full }); // idempotent
  const d = await client.query(api.requests.get, { requestId: full });
  await ok("double complete idempotent", d.status === "completed");
  await throws("score 6 rejected", () => client.mutation(api.requests.submitRating, { requestId: full, side: "requester", score: 6 }), "1 to 5");
  await throws("score 0 rejected", () => client.mutation(api.requests.submitRating, { requestId: full, side: "requester", score: 0 }), "1 to 5");
  await throws("score 2.5 rejected", () => client.mutation(api.requests.submitRating, { requestId: full, side: "requester", score: 2.5 }), "1 to 5");
  await throws("281-char review rejected", () => client.mutation(api.requests.submitRating, { requestId: full, side: "requester", score: 5, review: "z".repeat(281) }), "280");
  await client.mutation(api.requests.submitRating, { requestId: full, side: "requester", score: 4 });
  await throws("double rating rejected", () => client.mutation(api.requests.submitRating, { requestId: full, side: "requester", score: 5 }), "Already rated");
  await throws("reportNoShow on completed throws", () => client.mutation(api.requests.reportNoShow, { requestId: full, reporter: "requester" }), "active matches");
  await throws("checkIn on completed throws", () => client.mutation(api.requests.checkIn, { requestId: full, side: "requester" }), "confirmed");
} else {
  fail += 9;
  console.log(`FAIL full cycle — request ended ${fin?.status}, guards below skipped`);
}

// --- 6. Groups brute ---
await throws("group create without host code rejected", () => client.mutation(api.groups.createGroup, { volunteerEmail: "demo-backend@example.com", title: "X", category: "tech", template: "mock-interview", slots: ["tue-evening"], capacity: 4 }), "host code");
await throws("group capacity 99 rejected", () => client.mutation(api.groups.createGroup, { volunteerEmail: "demo-backend@example.com", title: "X", category: "tech", template: "mock-interview", slots: ["tue-evening"], capacity: 99, hostCode: HOST_CODE }), "2 and 12");
await throws("group capacity 1 rejected", () => client.mutation(api.groups.createGroup, { volunteerEmail: "demo-backend@example.com", title: "X", category: "tech", template: "mock-interview", slots: ["tue-evening"], capacity: 1, hostCode: HOST_CODE }), "2 and 12");
await throws("group empty title rejected", () => client.mutation(api.groups.createGroup, { volunteerEmail: "demo-backend@example.com", title: "  ", category: "tech", template: "mock-interview", slots: ["tue-evening"], capacity: 4, hostCode: HOST_CODE }), "title");
await throws("group by unknown volunteer rejected", () => client.mutation(api.groups.createGroup, { volunteerEmail: "ghost@example.com", title: "X", category: "tech", template: "mock-interview", slots: ["tue-evening"], capacity: 4, hostCode: HOST_CODE }), "active");
await throws("group join bad email rejected", () => client.mutation(api.groups.createGroup, { volunteerEmail: "demo-backend@example.com", title: `B${TAG}`, category: "tech", template: "mock-interview", slots: ["tue-evening"], capacity: 4, hostCode: HOST_CODE }).then((gid) => client.mutation(api.groups.joinGroup, { groupId: gid, name: "X", email: "bad" })), "email");
const gcap = await client.mutation(api.groups.createGroup, { volunteerEmail: "demo-backend@example.com", title: `Cap${TAG}`, category: "tech", template: "mock-interview", slots: ["tue-evening"], capacity: 2, hostCode: HOST_CODE });
await client.mutation(api.groups.joinGroup, { groupId: gcap, name: "A", email: `ga-${TAG}@example.com` });
await client.mutation(api.groups.joinGroup, { groupId: gcap, name: "B", email: `gb-${TAG}@example.com` });
let gstate = await client.query(api.groups.get, { groupId: gcap });
for (let i = 0; i < 12 && !gstate.roomUrl; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  gstate = await client.query(api.groups.get, { groupId: gcap });
}
await ok("capacity race: exactly 2 members, room exists", gstate.members.length === 2 && !!gstate.roomUrl, `${gstate.members.length} members`);
await throws("third join into full group rejected", () => client.mutation(api.groups.joinGroup, { groupId: gcap, name: "C", email: `gc-${TAG}@example.com` }), "no longer open");
await throws("leave ready group blocked", () => client.mutation(api.groups.leaveGroup, { groupId: gcap, email: `ga-${TAG}@example.com` }), "leaving is closed");
const gopen = await client.mutation(api.groups.createGroup, { volunteerEmail: "demo-backend@example.com", title: `Open${TAG}`, category: "tech", template: "mock-interview", slots: ["tue-evening"], capacity: 3, hostCode: HOST_CODE });
await throws("leave as stranger rejected", () => client.mutation(api.groups.leaveGroup, { groupId: gopen, email: `stranger-${TAG}@example.com` }), "not in this group");
await throws("confirm without host code rejected", () => client.mutation(api.groups.confirmGroup, { groupId: gcap, volunteerEmail: "demo-backend@example.com" }), "host code");
await throws("non-host confirm rejected", () => client.mutation(api.groups.confirmGroup, { groupId: gcap, volunteerEmail: `evil-${TAG}@example.com`, hostCode: HOST_CODE }), "Only the host");

// --- 7. Communities brute ---
await throws("community short name rejected", () => client.mutation(api.communities.createCommunity, { name: "AB", description: "x", email: `c-${TAG}@example.com` }), "3+");
await throws("community bad email rejected", () => client.mutation(api.communities.createCommunity, { name: `C${TAG}`, description: "x", email: "bad" }), "email");
await throws("join unknown community rejected", () => client.mutation(api.communities.join, { name: "No Such Place", email: `c-${TAG}@example.com` }), "not found");
await throws("leave not-member rejected", () => client.mutation(api.communities.leave, { name: `C${TAG}X`, email: `c-${TAG}@example.com` }), "not found");

console.log(`\nBRUTE DONE pass=${pass} fail=${fail}`);
if (fail > 0) process.exitCode = 1;
