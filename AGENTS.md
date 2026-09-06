<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: One Hour (Burning Token hackathon)

AI-matched volunteering hub. Next.js + Convex + Nebius Token Factory + Daily.co.
See `README.md` for the full pitch and architecture.

**Known gotcha:** `BAAI/bge-multilingual-gemma2` (the embedding model in
Nebius's own docs) was deprecated and now 404s. The working embedding model
is `Qwen/Qwen3-Embedding-8B` (already set in `convex/nebius.ts`). If Nebius
changes their catalog again, check `GET https://api.tokenfactory.nebius.com/v1/models`
before assuming a model name from documentation is still valid -- this
failure mode is silent (empty embedding, matching just never finds anyone),
not a thrown error visible in the UI.

**Deployments.** Cloud project is `one-hour` (team `rafaelcastro7`).
Production backend: `https://energized-retriever-599.convex.cloud`.
Run production commands with `--prod`; without it you hit the dev
deployment, which has its own separate data and env vars.

**Env vars** (`npx convex env set KEY value [--prod]`, never in `.env.local`):
`NEBIUS_API_KEY`, `TAVILY_API_KEY` (reserved, not wired into any code path
yet), `DAILY_API_KEY`. Set on **both** dev and prod -- they do not carry
over. Verified with a full end-to-end run (register volunteer -> close
profile -> embed -> approve -> create request -> match -> confirm -> real
Daily.co room URL).

**Seeding a fresh deployment** is required or the app looks broken:
`npx convex run seedEvalCases:seed '{}' --prod` and
`npx convex run seedVolunteers:seed '{}' --prod`.

**External calls fail in practice.** Nebius calls take ~20s and do return
ETIMEDOUT under load. Every action that calls out (`buildAndMatch`,
`buildProfileAction`, `createRoom`) retries once and writes an explicit
failure state; without that, requests hang forever on a spinner with no
error. Keep that pattern for any new external call -- this bug was found
three separate times in three different flows.

**Red-team harness:** `convex/adversarialTests.ts` (`seedAttackers`,
`probe`, `purge`) reproduces a prompt-injection attack that once hijacked
matching outright. `convex/biasAudit.ts` measures linguistic bias. Both
import scoring from `convex/matchScoring.ts`, the single source of truth
shared with production -- do not reimplement cosine similarity locally.

**All code and copy must be in English** (explicit product decision) even
though the product itself is multilingual (English/Spanish/Chinese/French)
at runtime via the LLM prompts in `convex/nebius.ts`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
