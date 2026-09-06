# One Hour

AI-matched volunteering hub, built for the [Burning Token](https://www.burningtoken.dev/)
hackathon (Applied AI track, powered by Nebius Token Factory).

Ask for help or offer an hour of your time — no rigid forms. A short
conversation with an AI agent turns what you said into a structured profile,
matches it semantically against the volunteer pool, and generates a video
call the moment both sides confirm.

## Why

Time banking and skill-based volunteering already work as an economic model
(1 hour given = 1 hour you can claim back), but every real deployment of it
struggles with the same bottleneck: someone has to manually coordinate who
matches with whom. This project replaces that manual coordination step with
an AI pipeline, while keeping a human-in-the-loop approval gate for
sensitive categories — the goal isn't to remove judgment, it's to remove
the busywork.

## Stack

- **[Next.js](https://nextjs.org)** (App Router) — frontend
- **[Convex](https://convex.dev)** — reactive backend + database; powers the
  real-time "searching for a match" / "match found" state without any
  websocket code of our own
- **[Nebius Token Factory](https://tokenfactory.nebius.com)** — LLM +
  multilingual embeddings, OpenAI-compatible API. Runs the full matching
  pipeline: conversational intake → structured profile (JSON mode) →
  semantic embedding → LLM decision layer over the top-K candidates
- **[Daily.co](https://daily.co)** — programmatic video room creation on
  match confirmation

## How matching works

1. A person describes what they need or what they can offer, in a short
   back-and-forth with an LLM (not a form).
2. The LLM closes the conversation into a structured summary (category,
   urgency/availability, one-sentence description) via JSON mode.
3. That summary is embedded (`bge-multilingual-gemma2`) and compared by
   cosine similarity against the active volunteer pool.
4. The top-3 candidates by similarity are handed to a second LLM call,
   which makes the final call — this is the layer that can catch cases
   where the closest match by wording isn't actually the right one.
5. On confirmation, a Convex action calls the Daily.co API and the room
   URL appears live on both sides' screens via Convex's reactivity.

## Getting started

```bash
npm install
npx convex dev   # starts a local Convex deployment, writes .env.local
npm run dev      # in a second terminal
```

You'll need a `NEBIUS_API_KEY` (from [Nebius Token Factory](https://tokenfactory.nebius.com))
and a `DAILY_API_KEY` (from [Daily.co](https://daily.co), free tier is enough)
set as Convex environment variables:

```bash
npx convex env set NEBIUS_API_KEY sk-...
npx convex env set DAILY_API_KEY ...
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
convex/
  schema.ts              # data model: volunteers, requests, eval cases
  nebius.ts               # LLM pipeline: intake, profile closing, embeddings, decision
  volunteers.ts           # volunteer registration + manual approval gate
  volunteersActions.ts    # Node-runtime actions for volunteer profile building
  volunteersMutations.ts  # DB writes for volunteer profiles
  volunteersQueries.ts    # active-volunteer lookups (used inside actions)
  requests.ts             # help request lifecycle + status
  requestsActions.ts      # matching pipeline + Daily.co room creation
  evaluation.ts           # accuracy tracking against a small labeled test set

src/app/
  page.tsx                # landing
  request/                # "I need help" flow
  offer/                  # "I want to help" flow
  status/[id]/            # live match status (Convex reactivity)
  admin/                  # manual volunteer approval panel
```

## Known limitations (by design, not oversight)

- **Manual approval, not automated credential verification.** No country
  has a public API for verifying professional licenses in real time (we
  checked). Every real platform in this space (ADPList included, 30k+
  mentors) gates activation behind human review. We do the same, and treat
  it as a feature, not a shortcut.
- **Two categories at launch** (tech, languages) — picked because they're
  low-risk, easy to verify informally, and let us validate the matching
  pipeline with a real (small) pool instead of synthetic data.
- **Semantic matching isn't perfect.** See the evaluation results in the
  demo for a documented case where the embedding-only similarity would have
  picked the wrong match, and how the LLM decision layer catches it.
