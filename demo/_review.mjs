import fs from "node:fs";
import OpenAI from "openai";
const key = fs.readFileSync(process.env.TEMP + "/nebius_key.txt", "utf8").trim();
const o = new OpenAI({ baseURL: "https://api.tokenfactory.nebius.com/v1/", apiKey: key });

const copy = [
  { id: "home_tagline", en: "Give an hour of your time, or get an hour of help. Talk to our agent — no forms — and we find you the right match.", es: "Regala una hora de tu tiempo, o recibe una hora de ayuda. Habla con nuestro agente — sin formularios — y te encontramos el match ideal." },
  { id: "home_hero_cta", en: "I need help / I want to help", es: "Necesito ayuda / Quiero ayudar" },
  { id: "home_foot", en: "Tech and languages to start. Matching by an AI agent (Nebius Token Factory), not rigid forms. Measured live in /eval.", es: "Tech e idiomas para empezar. Matching con agente IA (Nebius Token Factory), sin formularios rígidos. Medido en vivo en /eval." },
  { id: "home_step1", en: "1. Talk, don't fill forms — A short conversation turns what you said into a structured profile.", es: "1. Habla, no llenes formularios — Una conversación corta convierte lo que dijiste en un perfil estructurado." },
  { id: "home_step2", en: "2. Semantic match + LLM rerank — Embeddings narrow to top-3, a second model picks and explains why.", es: "2. Match semántico + re-ranking IA — Embeddings reducen a top-3, un segundo modelo elige y explica por qué." },
  { id: "home_step3", en: "3. Real video on confirm — Both sides confirm, a Daily.co room appears live. Humans approve volunteers first.", es: "3. Video real al confirmar — Ambos confirman y la sala Daily.co aparece en vivo. Humanos aprueban voluntarios primero." },
  { id: "about_tagline", en: "An AI-matched volunteering hub. One hour given, one hour you can claim — without the manual coordination bottleneck.", es: "Un hub de voluntariado con IA. Una hora dada, una hora que puedes reclamar — sin el cuello de botella de la coordinación manual." },
  { id: "about_intro", en: "You describe what you need or offer, in conversation — not a form. The agent closes it into a structured profile (category, urgency, summary). That summary is embedded (Qwen3-Embedding-8B) and compared by cosine similarity. Top-3 candidates go to a second LLM call (Qwen3-30B) that picks and explains why. On confirm, a Daily.co video room is created live on both screens — or, for the AI volunteer, an instant Aria chat opens instead.", es: "Describes lo que necesitas u ofreces, en conversación — no un formulario. El agente lo cierra en un perfil estructurado (categoría, urgencia, resumen). Ese resumen se convierte en embedding (Qwen3-Embedding-8B) y se compara por similitud coseno. Los 3 mejores van a una segunda llamada LLM (Qwen3-30B) que elige y explica por qué. Al confirmar, se crea en vivo una sala Daily.co en ambas pantallas — o, para la voluntaria IA, un chat instantáneo con Aria." },
  { id: "about_measured", en: "The live eval at /eval runs a labelled set against the real pipeline — routing accuracy, seconds per match and tokens per match, measured live rather than asserted. A red-team harness found a working prompt injection and a keyword-stuffing attack — both fixed and regression-tested.", es: "La eval en vivo en /eval corre un set etiquetado contra el pipeline real — precisión de ruteo, segundos por match y tokens por match, medidos en vivo. Un harness red-team encontró una inyección de prompts funcional y un ataque de keyword-stuffing — ambos corregidos y con tests de regresión." },
  { id: "volunteers_intro", en: "Real people (and Aria, our AI fallback) giving an hour. Prefer the AI to choose? Request help.", es: "Gente real (y Aria, nuestra IA de respaldo) regalando una hora. ¿Prefieres que la IA elija? Pide ayuda." },
  { id: "sessions_intro", en: "Enter your email to see your requests and the sessions you host as a volunteer.", es: "Escribe tu correo para ver tus solicitudes y las sesiones que hospedas como voluntario." },
  { id: "aihelp_intro", en: "No human available right now? Aria answers instantly. Pick a topic — a human volunteer is still the better choice for anything sensitive.", es: "¿Sin humanos disponibles? Aria responde al instante. Elige un tema — un voluntario humano sigue siendo mejor para lo sensible." },
  { id: "admin_intro", en: "Manual human gate: verify each person is who they say they are before activating them, especially in sensitive categories.", es: "Puerta humana manual: verifica que cada persona sea quien dice ser antes de activarla, sobre todo en categorías sensibles." },
  { id: "eval_intro", en: "N labelled cases, run against the live Nebius pipeline (real API calls, not mocks) — category detection, embedding similarity, and the LLM decision layer over the top-3 candidates.", es: "N casos etiquetados, corridos contra el pipeline Nebius en vivo (llamadas reales, no mocks) — detección de categoría, similitud de embeddings y la capa LLM sobre el top-3." },
  { id: "jury_intro", en: "Everything below is measured on the live pipeline, not asserted. Try it yourself first, then read the evidence.", es: "Todo lo de abajo está medido en el pipeline en vivo, no afirmado. Pruébalo tú primero, luego lee la evidencia." },
  { id: "jury_pitch", en: "Try it in 2 minutes: Request help — write a need in Spanish to see language detection (it answers in your language). Watch the live stages + tips while matching runs (~20–35s). Confirm the match to generate a real Daily.co video room. Or register as a volunteer and see the human approval gate in /admin.", es: "Pruébalo en 2 minutos: Pide ayuda — escribe en español para ver la detección de idioma (responde en tu idioma). Mira las etapas en vivo + tips mientras corre el matching (~20–35s). Confirma el match para generar una sala Daily.co real. O regístrate como voluntario y mira la puerta humana en /admin." },
  { id: "jury_notwrapper", en: "Retrieve-then-rerank: an embedding (Qwen3-Embedding-8B) narrows the pool to the top-3 by cosine similarity, then Qwen3-30B (Nebius Token Factory) makes the final call and can overrule similarity when the text shows the closest match is wrong. The split is deliberate: one model judges once while embeddings scan everyone.", es: "Retrieve-then-rerank: un embedding (Qwen3-Embedding-8B) reduce el pool al top-3 por similitud coseno, luego Qwen3-30B (Nebius Token Factory) decide al final y puede contradecir la similitud cuando el texto muestra que el más cercano está mal. La división de modelos es una decisión deliberada de costo/latencia: un modelo juzga una vez y el embedding escanea a todos." },
  { id: "request_intro", en: "Tell us what you need", es: "Cuéntanos qué necesitas" },
  { id: "offer_intro", en: "Tell us what you can offer", es: "Cuéntanos qué puedes ofrecer" },
];

const prompt = `You are the harshest product critic and senior UX copywriter for a hackathon team. The product is "1hour", an AI-matched volunteering hub entering the Burning Token hackathon (category: Applied AI 60h full-stack + AI). Judges will spend ~2 minutes each. The product: users narrate a need/offer in chat (an LLM agent closes a structured profile), an embedding (Qwen3-Embedding-8B) narrows the pool to top-3 by cosine similarity, a second LLM (Qwen3-30B on Nebius Token Factory) makes the final pick WITH reasoning; confirming opens a live Daily.co room; real human volunteers (tech, languages) plus an AI fallback "Aria"; every volunteer passes a human approval gate (/admin); an /eval page shows live accuracy, latency, token cost measured against real API calls; a red-team harness found and fixed a prompt injection and a keyword-stuffing attack.

Nav tabs currently: About, Volunteers, Groups, Communities, Sessions, Jury, Evidence (/eval), plus CTA "Get help" (/request) and a Demo /demo page. The team suspects Groups and Communities are fluff that dilutes the story.

TASKS (be brutal, concrete, and ON-BRAND: honest, tight, memorable, zero hype that isn't earned — the team's whole identity is "measured, not claimed"):
1) For each string below, give a rewritten UK-EN version and a matching ES (Argentine) version: shorter, sharper, more persuasive, still honest. Keep all hard facts (model names, seconds, caveats). No marketing fluff. Preserve links and /paths mentioned.
2) Recommend which nav tabs to keep vs hide (routes must stay live). State the ideal 4-5 tab nav for judges.
3) Recommend what info on the /admin approval cards is secondary and should be hidden (fields currently: email, category, profile summary, LinkedIn link/no, quiz score 0/3 + skill level, availability slots). The card is for the human gate.

Return STRICT JSON only, no markdown, with this exact shape:
{"writes":[{"id":"home_tagline","en":"...","es":"...","why":"one line"}],"hideNav":["..."],"keepNav":["..."],"navNote":"one line","adminHiddenFields":["..."],"adminCardIdeal":"one short sentence"}

Current copy to improve: ${JSON.stringify(copy)}`;

const r = await o.chat.completions.create({
  model: "Qwen/Qwen3.5-397B-A17B",
  messages: [
    { role: "system", content: "You output only valid JSON. No markdown fences. No commentary." },
    { role: "user", content: prompt },
  ],
  temperature: 0.4,
  response_format: { type: "json_object" },
  max_tokens: 16000,
});
const out = r.choices[0].message.content;
fs.writeFileSync(process.env.TEMP + "/review.json", out);
const j = JSON.parse(out);
console.log("writes:", j.writes.length, "| hideNav:", (j.hideNav || []).join(","), "| keepNav:", (j.keepNav || []).join(","));
console.log("adminHiddenFields:", (j.adminHiddenFields || []).join(","));
console.log("adminCardIdeal:", j.adminCardIdeal);
console.log("navNote:", j.navNote);