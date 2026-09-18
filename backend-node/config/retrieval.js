// config/retrieval.js
// Backend and integration: IamAtomic
//
// Finds the passages most relevant to a question, so the assistant answers
// from the platform's own modules rather than from a model's general
// knowledge.
//
// Scoring is BM25, the ranking function behind most classic search engines.
// It is chosen over embeddings deliberately:
//
//   - no embedding API call per query, so no extra cost or latency
//   - no vector database to run, and nothing that empties on restart
//   - the knowledge base is a committed JSON file, so it works on a fresh
//     clone with no setup step
//
// The tradeoff is that it matches on words rather than meaning, so a question
// using entirely different vocabulary to the source will retrieve less well.
// For a fixed body of teaching material with consistent terminology, that
// tradeoff is worth taking.

const fs = require('fs');
const path = require('path');

const KB_PATH = path.join(__dirname, '..', 'data', 'knowledge-base.json');

// Words too common to carry meaning; keeping them would let a long passage
// score highly just by containing "the" many times.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'do', 'does', 'did', 'doing', 'have', 'has', 'had', 'having', 'i', 'you',
  'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my',
  'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
  'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while', 'of', 'to',
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'into', 'from', 'up',
  'down', 'out', 'over', 'under', 'again', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'should', 'would', 'could', 'what', 'which', 'who',
  'whom', 'how', 'why', 'where', 'all', 'any', 'both', 'each', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'as',
]);

function tokenise(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Crude stemming, enough to match "phishing" with "phish" and "attacks"
 *  with "attack" without pulling in a stemming library. */
function stem(word) {
  return word
    .replace(/ing$/, '')
    .replace(/ies$/, 'y')
    .replace(/es$/, '')
    .replace(/s$/, '');
}


/** Edit distance, capped so a clearly different word bails out early rather
 *  than computing a full matrix. */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (row[j] < best) best = row[j];
    }

    if (best > max) return max + 1;
    prev = row;
  }

  return prev[b.length];
}

/** Maps a mistyped query term onto the closest term the index actually has.
 *
 *  Without this, "pishing" matches nothing at all and the assistant claims it
 *  has no information on a topic it covers in depth. Short words are left
 *  alone, since at three or four characters an edit of one turns a word into
 *  a genuinely different one.
 */
function nearestKnownTerm(term, topicTerms) {
  // Four characters is the floor, because stemming shortens words before we
  // get here: "phishing" becomes "phish" and a typo of it becomes "pish".
  if (term.length < 4 || topicTerms.has(term)) return term;

  // Longer words tolerate more, since a two character slip in a four letter
  // word usually means a different word entirely.
  const allowed = term.length >= 6 ? 2 : 1;
  let best = null;
  let bestDistance = allowed + 1;

  // Only topic vocabulary is a candidate, not every indexed word.
  //
  // Matching against the whole index looked fine on typos but quietly mapped
  // unrelated questions onto real passages: "how do I bake bread" found
  // "spread" and answered confidently about recruitment scams. Restricting
  // the targets means an off topic word has nothing to land on, and the
  // assistant correctly says it does not cover the subject.
  for (const known of topicTerms) {
    // A typo almost never changes the first letter, but a different word
    // frequently does. Without this check "bake" corrected to "fake" and a
    // question about baking bread was answered with recruitment scams.
    if (term[0] !== known[0]) continue;

    const d = editDistance(term, known, allowed);
    if (d < bestDistance) {
      best = known;
      bestDistance = d;
      if (d === 1) break;
    }
  }

  return best || term;
}

let index = null;

function loadIndex() {
  if (index) return index;

  if (!fs.existsSync(KB_PATH)) {
    console.warn('[retrieval] No knowledge base found. Run `npm run kb:build`.');
    index = { entries: [], df: new Map(), avgLength: 0 };
    return index;
  }

  const { entries } = JSON.parse(fs.readFileSync(KB_PATH, 'utf8'));

  // Document frequency: how many passages each term appears in. Rare terms
  // are worth more, which is what stops a match on a common word dominating.
  const df = new Map();
  let totalLength = 0;

  const prepared = entries.map((entry) => {
    const bodyTerms = tokenise(entry.text).map(stem);
    // The title is indexed separately. Folding it into the body would let it
    // be diluted among a hundred other words, which is why a question about
    // invoices was matching a passage on smishing.
    const titleTerms = new Set(tokenise(entry.title).map(stem));

    const freq = new Map();
    for (const term of bodyTerms) freq.set(term, (freq.get(term) || 0) + 1);

    for (const term of new Set([...bodyTerms, ...titleTerms])) {
      df.set(term, (df.get(term) || 0) + 1);
    }

    totalLength += bodyTerms.length;
    return { ...entry, freq, titleTerms, length: bodyTerms.length };
  });

  // Words appearing in passage titles are the subjects this platform teaches,
  // which makes them the right targets for typo correction.
  const topicTerms = new Set();
  for (const entry of prepared) {
    for (const term of entry.titleTerms) topicTerms.add(term);
  }

  index = {
    entries: prepared,
    df,
    topicTerms,
    avgLength: prepared.length ? totalLength / prepared.length : 0,
  };
  return index;
}

/** Returns the passages most relevant to the question, best first. */
function search(question, limit = 4) {
  const { entries, df, topicTerms, avgLength } = loadIndex();
  if (!entries.length) return [];

  const queryTerms = [...new Set(
    tokenise(question)
      .map(stem)
      .map((term) => nearestKnownTerm(term, topicTerms))
  )];
  if (!queryTerms.length) return [];

  const N = entries.length;
  const k1 = 1.5;   // how quickly repeated terms stop adding to the score
  const b = 0.75;   // how much passage length is penalised

  // A term appearing in the title is a much stronger signal than the same
  // term buried in the body, so it carries extra weight.
  const TITLE_WEIGHT = 2.5;

  const scored = entries.map((entry) => {
    let score = 0;
    let titleHits = 0;

    for (const term of queryTerms) {
      const n = df.get(term) || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));

      const f = entry.freq.get(term);
      if (f) {
        const norm = f * (k1 + 1) /
          (f + k1 * (1 - b + b * (entry.length / (avgLength || 1))));
        score += idf * norm;
      }

      if (entry.titleTerms.has(term)) {
        score += idf * TITLE_WEIGHT;
        titleHits += 1;
      }
    }

    // Matching several query terms in the title means the passage is about
    // the question, not merely mentioning it. Without this, one strong term
    // can outrank a passage that matches the whole question.
    if (titleHits > 1) score *= 1 + 0.2 * (titleHits - 1);

    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({
      title: s.entry.title,
      source: s.entry.source,
      text: s.entry.text,
      score: Number(s.score.toFixed(3)),
    }));
}

function isReady() {
  return loadIndex().entries.length > 0;
}

module.exports = { search, isReady };
