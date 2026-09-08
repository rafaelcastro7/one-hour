"use node";

// Shared retrieval scoring. Production matching, the eval runner and the
// red-team harness all import from here so they can't drift apart and
// quietly test something the real pipeline no longer does.

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// Distinct topic areas a profile can claim. A genuine volunteer clusters in
// one or two of these; a profile stuffed with keywords to rank for every
// query touches many at once.
const TOPIC_MARKERS: Array<RegExp> = [
  /\b(postgres|sql|database|query|pooling)\b/i,
  /\b(react|next\.?js|frontend|hydration|css|html)\b/i,
  /\b(dns|hosting|deploy(ment)?|devops|infrastructure|server)\b/i,
  /\b(python|recursion|algorithm|data structure)\b/i,
  /\b(test(ing|s)?|pytest|jest|test suite)\b/i,
  /\b(resume|cv|interview|hiring|career)\b/i,
  /\b(french|français)\b/i,
  /\b(spanish|español|castellano)\b/i,
  /\b(mandarin|chinese|中文)\b/i,
  /\b(translation|localis|localiz|ui copy|terminology)\b/i,
];

/**
 * Counts how many unrelated topic areas a profile claims.
 *
 * This is the signal behind the breadth penalty: a shilling / profile
 * injection attack (arXiv:2402.09023) works by writing a profile that
 * enumerates every skill, so it sits near the centroid of many different
 * queries at once and reaches the top-K for all of them.
 */
export function topicBreadth(text: string): number {
  return TOPIC_MARKERS.filter((re) => re.test(text)).length;
}

// Profiles legitimately span a couple of areas ("backend and databases").
// Beyond this, breadth stops looking like range and starts looking like
// keyword stuffing.
const BREADTH_FREE_ALLOWANCE = 3;
const BREADTH_PENALTY_PER_TOPIC = 0.04;
const MAX_BREADTH_PENALTY = 0.25;

/**
 * Similarity with a penalty for implausibly broad profiles.
 *
 * Deliberately a soft penalty, not a filter: a real polymath volunteer is
 * demoted a little, never excluded, and the LLM reranker still gets to see
 * them. It costs a genuine generalist a few ranking positions; it costs a
 * keyword-stuffed profile its free ride into the top-K.
 */
export function penalisedScore(rawScore: number, profileText: string): number {
  const breadth = topicBreadth(profileText);
  const excess = Math.max(0, breadth - BREADTH_FREE_ALLOWANCE);
  const penalty = Math.min(excess * BREADTH_PENALTY_PER_TOPIC, MAX_BREADTH_PENALTY);
  return rawScore - penalty;
}

// Congestion control: volunteers who already served many matches are demoted
// slightly so the load spreads instead of piling onto the popular few.
// -0.02 per past match, capped at -0.10 (never decisive on its own).
const LOAD_PENALTY_PER_MATCH = 0.02;
const MAX_LOAD_PENALTY = 0.1;

export function loadPenalty(matchCount: number): number {
  return Math.min(Math.max(0, matchCount) * LOAD_PENALTY_PER_MATCH, MAX_LOAD_PENALTY);
}

// Lexical grounding bonus: shared distinctive words between the need and the
// profile add a small bonus (capped). This partly offsets the measured bias
// against simpler, non-native phrasing, whose embeddings are systematically
// less distinctive: when the right keywords are there, the score reflects it
// even if the vector is flatter.
const KEYWORD_BONUS_PER_WORD = 0.01;
const MAX_KEYWORD_BONUS = 0.05;
const STOPWORDS = new Set(
  "a,an,the,and,or,but,of,to,in,on,for,with,my,i,me,we,you,he,she,it,they,is,are,was,were,be,been,have,has,had,do,does,did,not,no,yes,please,thanks,thank,hello,hi,want,need,help,like,just,very,really,so,that,this,these,those,as,at,by,from,about,into,over,after,before,when,what,which,who,how,can,could,would,should,will,also,more,most,some,any,all,only,too,much,many,your,our,their,his,her,its,el,la,los,las,un,una,de,en,y,que,por,para,con,mi,se,si,no,es,son,estoy,quiero,necesito,ayuda,por,favor,hola,le,les,del,al,como,más,muy,también,的,了,在,是,我,有,和,就,不,很,吗,呢,了,个,le,la,les,de,des,du,un,une,et,est,je,tu,il,vous,pour,avec,merci,bonjour".split(
    ","
  )
);

export function keywordOverlapBonus(needText: string, profileText: string): number {
  const words = (s: string) =>
    s
      .toLowerCase()
      .split(/[^a-záéíóúñüàâçèêëîïôùûœ\u4e00-\u9fff]+/u)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const need = new Set(words(needText));
  if (need.size === 0) return 0;
  const profile = new Set(words(profileText));
  let shared = 0;
  for (const w of need) if (profile.has(w)) shared++;
  return Math.min(shared * KEYWORD_BONUS_PER_WORD, MAX_KEYWORD_BONUS);
}

// Virtual volunteers (AI helpers) are demoted so humans always win when
// available. They exist as a fallback for empty pools and instant help, not
// as competition for real people.
const VIRTUAL_PENALTY = 0.15;

// Scheduling overlap: when the requester's slots intersect the volunteer's,
// both can actually meet. Small bonus -- availability never overrides skill
// fit, but it breaks ties toward people who are free when needed.
const AVAILABILITY_BONUS = 0.05;

export function availabilityBonus(reqSlots: string[] | undefined, volSlots: string[] | undefined): number {
  if (!reqSlots || reqSlots.length === 0) return 0;
  if (!volSlots || volSlots.length === 0) return 0;
  const set = new Set(volSlots);
  return reqSlots.some((s) => set.has(s)) ? AVAILABILITY_BONUS : 0;
}

// Reputation: proven volunteers (high avg rating) get a small lift;
// unreliable ones (no-shows) get demoted. Ratings and attendance are the
// two signals every leading platform runs on -- this is our version.
export function reputationBonus(avgRating: number | null, noShowCount: number): number {
  let bonus = 0;
  if (avgRating !== null) {
    if (avgRating >= 4.5) bonus += 0.03;
    else if (avgRating >= 4.0) bonus += 0.01;
  }
  if (noShowCount >= 2) bonus -= 0.05;
  else if (noShowCount >= 1) bonus -= 0.02;
  return bonus;
}

export function avgRatingOf(vol: { ratingSum?: number; ratingCount?: number }): number | null {
  if (!vol.ratingCount) return null;
  return (vol.ratingSum ?? 0) / vol.ratingCount;
}

export type ScoredVolunteer = {
  id?: string;
  embedding: number[];
  profileSummary: string;
  matchCount?: number;
  isVirtual?: boolean;
  slots?: string[];
  ratingSum?: number;
  ratingCount?: number;
  noShowCount?: number;
};

// Asked-for-again bonus: a recurring user who names their volunteer gets
// them heavily weighted. Trust already earned beats similarity guesses.
const REQUESTED_BONUS = 0.1;

/**
 * Single source of truth for retrieval scoring. Production matching, the eval
 * runner, the red-team harness and the bias audit all use this, so a defence
 * proven in one place holds everywhere.
 */
export function scoreCandidate(
  needEmbedding: number[],
  needSummary: string,
  vol: ScoredVolunteer,
  reqSlots?: string[],
  preferredVolunteerId?: string
): number {
  const base = penalisedScore(
    cosineSimilarity(needEmbedding, vol.embedding),
    vol.profileSummary
  );
  return (
    base -
    loadPenalty(vol.matchCount ?? 0) +
    keywordOverlapBonus(needSummary, vol.profileSummary) -
    (vol.isVirtual ? VIRTUAL_PENALTY : 0) +
    availabilityBonus(reqSlots, vol.slots) +
    reputationBonus(avgRatingOf(vol), vol.noShowCount ?? 0) +
    (preferredVolunteerId && vol.id === preferredVolunteerId ? REQUESTED_BONUS : 0)
  );
}
