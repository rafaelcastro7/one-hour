"use client";

import { useEffect, useMemo, useState } from "react";

// Warm, fun thinking feed. ~50 tips across 5 families, picked by context
// (mode + progress + pipeline stage). Never repeats within a session, never
// mocks the user or the wait itself.

// --- FAMILY: sponsors, with a smile ---
const SPONSORS = [
  "Tip: matching runs on Nebius Token Factory — big models, tiny bill.",
  "Tip: Nebius does the heavy thinking twice per match. Worth it.",
  "Tip: live state syncs via Convex — no refresh button needed, ever.",
  "Tip: Convex reactivity is why this page updates by itself. Magic, but real.",
  "Tip: video rooms are real Daily.co rooms the moment both sides confirm.",
  "Tip: Daily.co spins your room up in seconds. Popcorn optional.",
  "Tip: this frontend rides on Render — sponsor-grade hosting.",
  "Tip: Linkup grounds Aria's answers in live web sources. No hallucinating alone.",
  "Tip: Qwen embeddings read meaning, not keywords. Fancy, right?",
  "Tip: Llama-3.3-70B makes the final call — the wise elder of this operation.",
];

// --- FAMILY: how the product works ---
const PRODUCT = [
  "Reading your message…",
  "Getting the full picture…",
  "Almost there — wrapping up…",
  "Comparing your need against active volunteers…",
  "Narrowing the pool to the top-3 candidates…",
  "A second model is picking the best match and saying why…",
  "Checking who is free when you are…",
  "Weighing skills, availability and good vibes…",
  "Tip: humans approve every volunteer before they can be matched.",
  "Tip: your summary is matched in English, whatever language you write in.",
  "Tip: the closest wording doesn't always win — the reranker knows.",
  "Tip: keyword-stuffed profiles get quietly demoted. Fair is fair.",
];

// --- FAMILY: trust & safety, warmly ---
const TRUST = [
  "Tip: volunteers are kind humans giving their time — not professionals.",
  "Tip: in crisis? findahelpline.com lists free lines by country.",
  "Tip: a good session starts with clear boundaries. We set them upfront.",
  "Tip: volunteers take a skills check — 2 of 3 to pass. No pressure, right?",
  "Tip: LinkedIn verifies every volunteer's identity. Real people only.",
  "Tip: sessions last one full hour. Good things take time.",
  "Tip: stepping back from an out-of-scope session is the right call, not a failure.",
  "Tip: your email is only used to reach you about your match. That's it.",
];

// --- FAMILY: impact & community ---
const IMPACT = [
  "One hour given is one hour earned. Time banking at its simplest.",
  "Small help, big day: most matches start with something embarrassingly simple.",
  "Volunteers keep 100% of the glory. We just do the matchmaking.",
  "Tech or languages today — low-risk categories while we learn.",
  "Someone, somewhere, debugged Postgres at midnight thanks to this.",
  "Your request helps the system learn what good matching looks like.",
  "Behind every match: a human who said 'I have an hour'.",
  "Multilingual by design — help in the language you dream in.",
];

// --- FAMILY: playful, never at the user's expense ---
const PLAYFUL = [
  "Consulting the volunteering spirits…",
  "Teaching embeddings to read between the lines…",
  "Polishing candidate profiles…",
  "Asking the LLM nicely to hurry up…",
  "Counting tokens so you don't have to…",
  "Herding volunteers (gently)…",
  "Warming up the video room…",
  "Double-checking nobody is a keyword-stuffing robot…",
  "Reticulating splines… just kidding. Matching humans.",
  "Good matches take ~30 seconds. Great ones too.",
];

// --- FAMILIA ES: patrocinadores, con una sonrisa ---
const SPONSORS_ES = [
  "Dato: el matching corre en Nebius Token Factory — modelos grandes, cuenta pequeña.",
  "Dato: Nebius piensa fuerte dos veces por match. Lo vale.",
  "Dato: el estado en vivo se sincroniza con Convex — jamás necesitas recargar.",
  "Dato: la reactividad de Convex es por lo que esta página se actualiza sola.",
  "Dato: las salas de video son salas Daily.co reales al confirmar ambos lados.",
  "Dato: Daily.co levanta tu sala en segundos.",
  "Dato: este frontend vive en Render — hosting de nivel patrocinador.",
  "Dato: Linkup fundamenta las respuestas de Aria en fuentes web en vivo.",
  "Dato: los embeddings Qwen leen significado, no palabras clave.",
  "Dato: Llama-3.3-70B toma la decisión final — la sabia mayor de la operación.",
];

// --- FAMILIA ES: cómo funciona el producto ---
const PRODUCT_ES = [
  "Leyendo tu mensaje…",
  "Armando el panorama completo…",
  "Ya casi — cerrando…",
  "Comparando tu necesidad con voluntarios activos…",
  "Reduciendo a los 3 mejores candidatos…",
  "Un segundo modelo elige el mejor match y explica por qué…",
  "Revisando quién está libre cuando tú lo estás…",
  "Sopesando habilidades, disponibilidad y buena vibra…",
  "Dato: humanos aprueban cada voluntario antes de emparejarlo.",
  "Dato: tu resumen se empareja en inglés, escribas en el idioma que escribas.",
  "Dato: la redacción más parecida no siempre gana — el re-ranker lo sabe.",
  "Dato: los perfiles rellenos de palabras clave bajan solitos. Lo justo es justo.",
];

// --- FAMILIA ES: confianza y seguridad, con calidez ---
const TRUST_ES = [
  "Dato: los voluntarios son humanos amables regalando su tiempo — no profesionales.",
  "Dato: ¿en crisis? findahelpline.com lista líneas gratuitas por país.",
  "Dato: una buena sesión empieza con límites claros. Los ponemos al inicio.",
  "Dato: los voluntarios pasan una prueba — 2 de 3 para pasar.",
  "Dato: LinkedIn verifica la identidad de cada voluntario. Solo gente real.",
  "Dato: las sesiones duran una hora completa. Lo bueno toma tiempo.",
  "Dato: retirarse de una sesión fuera de alcance es lo correcto, no un fracaso.",
  "Dato: tu correo solo se usa para contactarte sobre tu match. Nada más.",
];

// --- FAMILIA ES: impacto y comunidad ---
const IMPACT_ES = [
  "Una hora dada es una hora ganada. Banco de tiempo en su forma simple.",
  "Ayuda pequeña, gran día: la mayoría de matches empieza con algo simple.",
  "Los voluntarios se quedan con el 100% de la gloria. Nosotros solo emparejamos.",
  "Tech o idiomas por ahora — categorías de bajo riesgo mientras aprendemos.",
  "Alguien, en algún lugar, depuró Postgres a medianoche gracias a esto.",
  "Tu solicitud ayuda al sistema a aprender qué es un buen match.",
  "Detrás de cada match: un humano que dijo 'tengo una hora'.",
  "Multilingüe por diseño — ayuda en el idioma en que sueñas.",
];

// --- FAMILIA ES: juguetones, nunca a tu costa ---
const PLAYFUL_ES = [
  "Consultando a los espíritus del voluntariado…",
  "Enseñando a los embeddings a leer entre líneas…",
  "Puliendo perfiles de candidatos…",
  "Pidiendo amablemente al LLM que se apure…",
  "Contando tokens para que tú no tengas que hacerlo…",
  "Arreando voluntarios (con suavidad)…",
  "Calentando la sala de video…",
  "Verificando que nadie sea un robot rellena-palabras…",
  "Buenos matches toman ~30 segundos. Los geniales también.",
];

const BY_MODE: Record<string, string[][]> = {
  need: [PRODUCT, TRUST, IMPACT, PLAYFUL, SPONSORS],
  offer: [PRODUCT, TRUST, IMPACT, PLAYFUL, SPONSORS],
  ai: [PRODUCT, SPONSORS, PLAYFUL, IMPACT],
  matching: [PRODUCT, SPONSORS, IMPACT, PLAYFUL],
};

const BY_MODE_ES: Record<string, string[][]> = {
  need: [PRODUCT_ES, TRUST_ES, IMPACT_ES, PLAYFUL_ES, SPONSORS_ES],
  offer: [PRODUCT_ES, TRUST_ES, IMPACT_ES, PLAYFUL_ES, SPONSORS_ES],
  ai: [PRODUCT_ES, SPONSORS_ES, PLAYFUL_ES, IMPACT_ES],
  matching: [PRODUCT_ES, SPONSORS_ES, IMPACT_ES, PLAYFUL_ES],
};

const OFFER_EXTRA = [
  "Tip: you'll need 2 of 3 on the skills check to be eligible.",
  "Tip: your LinkedIn verifies your identity for matching.",
  "Tip: mark when you're free — matching respects your slots.",
];

const OFFER_EXTRA_ES = [
  "Dato: necesitas 2 de 3 en la prueba para ser elegible.",
  "Dato: tu LinkedIn verifica tu identidad para el matching.",
  "Dato: marca cuándo estás libre — el matching respeta tus horarios.",
];

type TipsContext = {
  mode?: "need" | "offer" | "ai" | "matching";
  messageCount?: number;
  lang?: "en" | "es";
};

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PipelineTips({
  mode = "need",
  messageCount = 0,
  intervalMs = 4000,
  lang = "en",
}: TipsContext & { intervalMs?: number }) {
  // One shuffle per mount: contextual pool, no repeats within the session.
  const tips = useMemo(() => {
    const table = lang === "es" ? BY_MODE_ES : BY_MODE;
    const families = table[mode] ?? table.need;
    const progress =
      mode === "matching"
        ? []
        : messageCount <= 2
          ? [lang === "es" ? "Leyendo tu mensaje…" : "Reading your message…"]
          : messageCount <= 5
            ? [lang === "es" ? "Armando el panorama completo…" : "Getting the full picture…"]
            : [lang === "es" ? "Ya casi — cerrando…" : "Almost there — wrapping up…"];
    const extra = mode === "offer" ? (lang === "es" ? OFFER_EXTRA_ES : OFFER_EXTRA) : [];
    // Interleave families round-robin so categories mix instead of clumping.
    const pools = [...families.map((f) => [...f]), [...extra]];
    const mixed: string[] = [...progress];
    let added = true;
    while (added) {
      added = false;
      for (const pool of pools) {
        const next = pool.shift();
        if (next !== undefined && !mixed.includes(next)) {
          mixed.push(next);
          added = true;
        }
      }
    }
    return shuffled(mixed.slice(1)).length > 0
      ? [mixed[0], ...shuffled(mixed.slice(1))]
      : mixed;
  }, [mode, messageCount, lang]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [mode, messageCount, lang]);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % tips.length), intervalMs);
    return () => clearInterval(id);
  }, [tips.length, intervalMs]);

  return (
    <div className="flex items-center gap-2 text-sm text-neutral-400" role="status" aria-live="polite">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce" />
      </span>
      <span key={`${mode}-${messageCount}-${lang}-${index}`} className="animate-pulse">
        {tips.length > 0 ? tips[index % tips.length] : "…"}
      </span>
    </div>
  );
}
