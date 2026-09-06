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
3. That summary is embedded (`Qwen/Qwen3-Embedding-8B`) and compared by
   cosine similarity against the active volunteer pool.
4. The top-3 candidates by similarity are handed to a second LLM call,
   which makes the final call — this is the layer that can catch cases
   where the closest match by wording isn't actually the right one.
5. On confirmation, a Convex action calls the Daily.co API and the room
   URL appears live on both sides' screens via Convex's reactivity.

### What the evaluation actually shows

`/eval` runs a labeled test set against this exact pipeline on real API
calls, and reports accuracy, latency and token cost per run. On the
current demo pool it scores **10/10 on category routing, ~34s median
end-to-end latency, ~490 tokens per match**.

**An honest result:** the adversarial case we designed — someone asking for
a *technical review of French UI copy* rather than conversation practice,
in a pool that also contains two general French conversation volunteers —
was picked correctly **by embedding similarity alone**. The LLM decision
layer agreed rather than overriding. So on this test set we have not yet
demonstrated the reranker catching a hard negative that retrieval got
wrong; we've demonstrated the two stages agreeing.

That's worth stating plainly rather than dressing up. The reranker earns
its ~20s and its tokens in the literature (see below) and it gives every
match a human-readable justification, which is independently valuable when
you're asking someone to trust a stranger with an hour of their life. But
the specific claim "our reranker fixes retrieval mistakes" is not something
this eval set proves yet. Building a test set where retrieval genuinely
fails is the honest next step, and `/eval` is the harness for it.

Latency is the other measured weakness: at ~34s per match this is not yet
an interactive experience. The status page shows real pipeline stages
instead of one opaque spinner, but that mitigates the wait rather than
fixing it.

`/eval` also reports accuracy, average pipeline latency, and average token
cost across the labeled set on every run. Which model does which job is a
deliberate cost/latency split, not an arbitrary choice:
`meta-llama/Llama-3.3-70B-Instruct` handles conversation and the one
judgment call that actually needs a large model, while the much cheaper
`Qwen/Qwen3-Embedding-8B` handles the initial narrowing pass over the
whole volunteer pool.

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

## Prior work this builds on

The two-stage design here isn't improvised — it's the **retrieve-then-rerank**
pattern from information retrieval, with an LLM acting as a **listwise
reranker** over the candidates that dense retrieval surfaced.

- **[RankGPT — "Is ChatGPT Good at Search?"](https://arxiv.org/abs/2304.09542)**
  (Sun et al., EMNLP 2023): establishes LLMs as effective listwise rerankers
  over retrieved results without fine-tuning. This is directly the role of
  `decideMatch` in `convex/nebius.ts`.
- **[Anthropic — Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)**:
  reports that adding a reranking pass cuts top-20 retrieval failure rate
  substantially versus embeddings alone — the quantitative case for why the
  second LLM call earns its latency and token cost.
- **[Semantics at an Angle](https://arxiv.org/abs/2504.16318)** (2025): analyses
  *why* cosine similarity fails in specific cases (normalization discards
  magnitude, anisotropy, hubness). Our adversarial eval case is a concrete
  instance of this.
- **[ANCE](https://arxiv.org/abs/2007.00808)** (Xiong et al., ICLR 2021): the
  origin of **"hard negative"** — the correct technical name for our
  adversarial case, where the nearest neighbour by embedding distance is the
  wrong answer.
- **[ConFit v3](https://arxiv.org/abs/2605.09760)**: resume-to-job matching
  with embedding retrieval plus LLM reranking — the closest published
  analogue to what we do, structurally, on human-to-human matching.

Reranking as a first-class step is also documented industry practice:
[Cohere Rerank](https://docs.cohere.com/docs/rerank-overview), LlamaIndex node
postprocessors, and LangChain's `LLMListwiseRerank` all ship it as a standard
module rather than an optimization.

One honest gap: we found **no published research specific to volunteer
matching**. The nearest well-studied framing is reciprocal recommendation
(both sides must be satisfied, as in mentor–mentee or job matching), which is
the lens we'd use if this became a research question rather than a product.

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
