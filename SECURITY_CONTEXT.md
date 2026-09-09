# Security context and local coordination

Last updated: 2026-09-08.

This file is the short handoff for Codex, OpenCode and Claude. Keep it current
when changing security-sensitive flows.

## Chat model (P1-3 latency, shipped 2026-09-08)

- Default chat model is now `Qwen/Qwen3-30B-A3B-Instruct-2507`
  (benchmarked ~4-5s vs ~20-45s for Llama-3.3-70B on the decideMatch
  rerank, same routing decision, same rejection of direct-override and
  authority-spoof attackers; **live prod eval after the switch: 10/10
  accuracy, mean latency 4.7s; prod red-team probe attackerWon=false**).
- Override without a redeploy: set `NEBIUS_CHAT_MODEL` in Convex env on
  both dev and prod to `meta-llama/Llama-3.3-70B-Instruct` to revert.
- `convex/nebius.ts` and `convex/evalRunner.ts` read it at runtime.

## Current access model

- Public request/session links are intentionally share-link based.
- Community creation, join and leave are public email-based actions.
- Admin approval is protected by `ADMIN_APPROVAL_KEY`.
- Group hosting controls are protected by `GROUP_HOST_CODE`.

These two keys are a pragmatic hackathon guard, not production identity. A
serious production version should replace them with Convex Auth, Clerk, or a
signed JWT flow and derive the actor from `ctx.auth.getUserIdentity()` instead
of trusting email arguments from the browser.

## What changed in this pass

- `volunteers.pendingApproval` now requires an admin key, so the pending
  volunteer queue is not publicly enumerable.
- `volunteers.approve` now requires an admin key and returns a clear validation
  error if a pending volunteer has no embedding, instead of crashing.
- `groups.createGroup`, `groups.confirmGroup` and `groups.closeGroup` now
  require a host code, so a public caller cannot impersonate a known volunteer
  email to host or close a group.
- `/admin` asks for the approval key before loading or approving volunteers.
- `/groups` asks for the private host code when creating a session.
- The malicious and dumb-user persona scripts now assert the new guards.

## Local/prod secrets

Never commit live key values.

Local development can keep these in `.env.local`, which is gitignored:

```bash
ADMIN_APPROVAL_KEY=...
GROUP_HOST_CODE=...
```

Production values are Convex environment variables on
`https://energized-retriever-599.convex.cloud`.

The current public frontend is Render:

```text
https://onehour-vn98.onrender.com
```

## Verification commands

Development:

```bash
npx convex dev --once
npm run test:persona
node probe-approve.mjs
npm test
npm run build
```

Production admin queue probe:

```bash
$env:ADMIN_APPROVAL_KEY="..."
node probe-prod-pending.mjs
```

## Still open

- Session/request actions still rely on knowledge of the request ID. Anyone
  with a status URL can act on that session. That is compatible with a
  share-link MVP, but it is not strong user identity.
- `requests.listByEmail` and `requests.listByVolunteer` are email-only lookup
  endpoints. A caller who knows an email can enumerate related sessions.
- Group host control is currently a global shared code, not per-host identity.
- Community membership is intentionally open, but still spam-prone.
