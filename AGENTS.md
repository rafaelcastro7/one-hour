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

**Env vars** (`npx convex env set KEY value`, never in `.env.local`):
`NEBIUS_API_KEY`, `TAVILY_API_KEY` (reserved, not wired into any code path
yet), `DAILY_API_KEY`. All three are live/real as of the last working
session -- verified with a full end-to-end run (register volunteer -> close
profile -> embed -> approve -> create request -> match -> confirm -> real
Daily.co room URL).

**All code and copy must be in English** (explicit product decision) even
though the product itself is multilingual (English/Spanish/Chinese/French)
at runtime via the LLM prompts in `convex/nebius.ts`.
