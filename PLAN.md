# One Hour — execution plan to submission

Burning Token hackathon (NERDCONF). Track: **Applied AI · Nebius**.
Judged asynchronously on six dimensions: **Problem, Product, Execution,
Validation, Experience, Demo**.

This file is the single source of truth for what is done, what is pending,
and what we deliberately decided not to do. Nothing should be "in my head."

---

## Scoring reality check

| Rubric dimension | Where we stand | Blocker |
|---|---|---|
| Problem | Strong — real need, clearly framed | — |
| Product | Strong — full flow works end to end | — |
| Execution | **Zero externally** — no public URL, no public repo | P0-1, P0-2 |
| Validation | Strong — live eval + red-team harness with real findings | — |
| Experience | Untested by anyone but us | P0-1 |
| Demo | **Zero** — no video exists | P0-3 |

Two of six dimensions currently score zero regardless of code quality.
That sets the priority order below: **ship first, polish second.**

---

## P0 — Submission blockers (nothing else matters until these are done)

### P0-1. Deploy to a public URL — **LIVE**
- [x] Convex cloud project created and deployed:
      `https://energized-retriever-599.convex.cloud`
- [x] Prod env vars set (they do NOT inherit from dev).
- [x] Prod seeded: 10 eval cases + 10 volunteers.
- [x] Verified prod matching end to end (Spanish request → correct match).
- [x] **Frontend live: https://onehour-vn98.onrender.com**
      All routes 200; bundle confirmed pointing at the prod Convex backend.
      Current deploy target: Render.

### P0-1 (Render deployment checklist)
- [x] Convex production deployment live:
      `https://energized-retriever-599.convex.cloud`.
- [x] Convex production env vars set separately from dev.
- [x] Deploy the Next.js frontend to Render (credits already claimed,
      code `HTHON-1318FC`, $50). Build command `npm run build`,
      start `npm run start`, env `NEXT_PUBLIC_CONVEX_URL`.
- [x] Seed the prod database: `seedEvalCases:seed` + `seedVolunteers:seed`.
      **A judge opening an empty app sees nothing work.**
- [ ] Verify the public URL end to end from a browser: request → match →
      confirm → Daily room opens.

### P0-2. Public GitHub repo — **DONE**
- [x] Live at https://github.com/rafaelcastro7/one-hour
- [x] Full history scanned for secrets — clean.
- [ ] Paste repo URL into the submission form (needs P0-4).

### P0-3. Demo video (≤2 min) + X post
- [x] Scripted shot-by-shot in `DEMO_SCRIPT.md`, with verified numbers.
- [x] Flow rehearsed end to end in Spanish — passed after fixing a hang.
- [ ] Record, tagging **@nerdconf_ar** in the post or a comment.
- [ ] Paste post URL into the submission form.

### P0-4. Finish the submission form
Already saved: name, one-liner, description, AI-tooling answer, Applied AI
track selected with evidence text. Still empty:
- [ ] Project URL (needs P0-1)
- [ ] X post URL (needs P0-3)
- [ ] GitHub URL (needs P0-2)
- [ ] Press **Submit** — it is currently a *draft*, and a draft is not an entry.

---

## P1 — Highest-value fixes before deadline

### P1-1. Retrieval hardening — **DONE**
- [x] Breadth penalty in `convex/matchScoring.ts`; stuffed profiles no longer
      reach the top-3 (was rank #2 at 0.559, now absent).
- [x] Shared scoring module so production, eval and red-team can't drift.
- [x] Verified with `adversarialTests:probe`: `attackersReachedTop3: []` on
      the realistic probe, and on the hard probe the reranker picks the one
      legitimate volunteer from rank #3 while naming the manipulation.
- [x] Side effect: this produced the genuine hard negative P2-1 wanted.

### P1-2. Linguistic bias audit — **DONE (measured, partial finding)**
- [x] `convex/biasAudit.ts`: 5 needs in native vs non-native phrasing.
- [x] Result: mean rank delta **0**, none lost top-3, but similarity score
      **lower in 5 of 5** by 2–7 points, always same direction.
- [x] Documented honestly in README as "no rank change at this scale",
      not "no bias" — a consistent one-sided penalty is what flips
      orderings on a denser pool.
- [ ] Re-run as the volunteer pool grows (audit is committed and repeatable).
- [ ] Optional: surface the audit in `/eval` alongside accuracy.

### P1-3. Latency
~34s per match, two sequential ~20s Nebius calls. Status page now shows real
stages instead of an opaque spinner, which mitigates but does not fix it.
- [ ] Try a smaller/faster Nebius model for `closeProfile` and measure the
      accuracy/latency trade-off on the eval set. Decide with data.

---

## Tests — DONE (scoring defence)
- [x] `convex/matchScoring.test.ts`: 10 vitest cases over cosine similarity
      and the breadth penalty, including the exact keyword-stuffing attack.
      `npm test`. Build/typecheck verified unaffected.
- [ ] Optional: convex-test cases for the pipeline mutations (needs
      edge-runtime env; the scoring logic was the high-value target).

## P2 — Only if P0 and P1 are fully closed

- [x] ~~Build a hard negative where retrieval genuinely fails~~ — obtained
      via P1-1: under adversarial load the reranker rescues the match from
      rank #3. A *non-adversarial* hard negative would still be nice.
- [ ] Reciprocal utility: model whether the *volunteer* wants the match.
      Today the system optimises one-sided utility only.
- [ ] Match-distribution metric (Gini) to detect congestion.
- [~] Pre-session screening — DONE (requester side): SafetyScreen.tsx states
      the role boundary, routes crisis to findahelpline.com, requires
      acknowledgement. Volunteer-side no-blame exit/referral still pending.

---

## Explicitly NOT doing (and why)

- **Loading real volunteers' personal data / contacting them.** Requested,
  but refused: using real people's data without consent and messaging them
  unprompted is a legal exposure (habeas data, GDPR) and an ethics failure a
  judge would rightly punish. The demo pool is clearly-labelled synthetic
  data with `example.com` addresses that cannot reach anyone.
- **Time-banking / hour-credit system.** Out of MVP scope; adds no points on
  this rubric.
- **Automated credential verification.** No country exposes a usable API;
  every serious platform (ADPList and peers) gates on human review. We do the
  same and say so.
- **Gradient-based corpus poisoning defence.** Real published attack, but
  needs white-box model access and hundreds of injected profiles. Named in
  the README as a scale threat; not mitigated.

---

## Appendix: demo video script (2 min)

Research on winning hackathon demos says: script it, don't wander.

1. **0:00–0:15 — the problem, human first.** A person needs an hour of help;
   a person has an hour to give. Coordinating them is the bottleneck.
2. **0:15–1:00 — live flow.** Type a real need in Spanish (shows multilingual
   without saying "multilingual"). Show the staged pipeline. Match appears
   *with a reason*. Confirm → real Daily.co room opens.
3. **1:00–1:35 — validation.** Open `/eval`: 10/10 routing, ~34s, ~490 tokens
   on real API calls. Then the red-team finding: the injection that hijacked
   the matcher, and the same attack being rejected after the fix.
4. **1:35–1:50 — the human gate.** Admin approval screen. Frame as a trust
   decision, not a missing feature.
5. **1:50–2:00 — what's still broken.** Name the retrieval weakness out loud.
   Judges reward calibration; overclaiming is what gets caught.

---

## Status log

- 2026-09-06 — Plan created. P0 items all blocked on actions only Rafael can
  take (Convex login, GitHub approval, recording). P1-1 startable now.
- 2026-09-06 — P0-2 done (repo public, no secrets). P1-1 done (breadth
  penalty; stuffed profiles no longer reach top-3; produced the genuine hard
  negative). P1-2 done (bias audit: rank held, similarity lower 5/5).
  P0-3 scripted and rehearsed. Production build verified, `render.yaml` ready.
  Fixed a request-hangs-forever bug found while rehearsing.
  **Only remaining blocker: `npx convex login` — two codes expired unused.
  Nothing else can proceed to a public URL without it.**
- 2026-09-08 — Security/context update: admin approval and group host controls
  now require private keys (`ADMIN_APPROVAL_KEY`, `GROUP_HOST_CODE`) in Convex.
  Dev/prod Convex functions deployed and verified. `persona-bruta.mjs` and
  `persona-maliciosa.mjs` pass against dev; production pending-approval probe
  returns data with the admin key instead of crashing. See
  `SECURITY_CONTEXT.md` for the live handoff and remaining auth gaps.
