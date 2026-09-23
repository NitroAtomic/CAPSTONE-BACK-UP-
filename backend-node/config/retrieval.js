// config/retrieval.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
//
// Hinahanap yung mga passage na pinaka-relevant sa tanong, para sumasagot
// yung assistant galing sa sariling modules natin, hindi galing sa general
// knowledge lang ng model.
//
// BM25 yung scoring, yung ranking function na ginagamit ng karamihan ng
// classic search engines. Sinadya to kesa embeddings dahil:
//
//   - walang embedding API call kada tanong, so wala extra cost/latency
//   - walang vector database na patatakbuhin, wala nawawala pag nag-restart
//   - JSON file lang yung knowledge base, committed na, gumagana agad sa
//     fresh clone, walang setup step
//
// Trade-off: word matching lang to hindi meaning, kaya kung ibang salita
// gamit yung tanong kesa source, mas mahina yung match. Pero para sa fixed
// na set ng teaching material na consistent yung terms, sulit yung trade-off.

const fs = require('fs');
const path = require('path');

const KB_PATH = path.join(__dirname, '..', 'data', 'knowledge-base.json');

// Mga salitang masyadong common, walang dalang meaning. Kung isasama, isang
// mahabang passage lang na maraming "the" pwede na mag-score ng mataas.
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

/** Simpleng stemming lang, sapat na para mag-match "phishing" sa "phish" at
 *  "attacks" sa "attack" nang hindi na nag-dadagdag ng library. */
function stem(word) {
  return word
    .replace(/ing$/, '')
    .replace(/ies$/, 'y')
    .replace(/es$/, '')
    .replace(/s$/, '');
}


/** Edit distance, may cap para agad huminto kung obvious naman na ibang
 *  salita, kesa kumpletuhin pa yung buong matrix. */
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

/** Kapag mali-type yung search term, hahanapin yung pinaka-malapit na salita
 *  na meron talaga sa index.
 *
 *  Kung wala to, walang mahahanap yung "pishing" kahit may sagot naman tayo.
 *  Maiiksing salita hindi na ginagalaw, kasi sa tatlo/apat na letra, kahit
 *  isang typo pwede na ibang salita talaga.
 */
function nearestKnownTerm(term, topicTerms, maxDistance) {
  // Apat na letra minimum, kasi na-stem na bago dumating dito: "phishing"
  // nagiging "phish", tapos yung typo niyan "pish".
  if (term.length < 4 || topicTerms.has(term)) return term;

  // Mas mahabang salita, mas malaking allowance, dahil kung dalawang letra
  // lang mali sa apat-letrang salita, malamang ibang salita na talaga.
  const allowed = maxDistance ?? (term.length >= 6 ? 2 : 1);
  let best = null;
  let bestDistance = allowed + 1;

  // Yung topic vocabulary lang candidate, hindi buong index.
  //
  // Dati buong index kinukumpara, ayos naman sa typo pero minsan nag-me-match
  // pa sa hindi related: "how do I bake bread" nag-match sa "spread" tapos
  // sumagot tungkol sa recruitment scams. Kung topic terms lang, walang
  // matatamaan yung off-topic na salita, tapos tama yung sagot na "wala
  // kaming info dyan".
  for (const known of topicTerms) {
    // Bihirang nagbabago yung unang letra sa typo, pero madalas nagbabago
    // pag ibang salita talaga. Kung wala to, "bake" naitama sa "fake" tapos
    // tanong tungkol sa pagluluto nasagutan ng recruitment scams.
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

  // Document frequency: sa ilang passages lumalabas yung bawat term. Yung
  // bihirang term mas mataas ang halaga, para hindi dominate yung common word.
  const df = new Map();
  const rawVocab = new Set();
  let totalLength = 0;

  const prepared = entries.map((entry) => {
    const rawWords = tokenise(entry.text + ' ' + entry.title);
    for (const w of rawWords) rawVocab.add(w);

    const bodyTerms = tokenise(entry.text).map(stem);
    // Hiwalay na-index yung title. Kung sasabay sa body, matatabunan lang sa
    // ibang salita — kaya dati nagkakamali, natatamaan yung smishing passage
    // kahit tungkol sa invoices dapat.
    const titleTerms = new Set(tokenise(entry.title).map(stem));

    const freq = new Map();
    for (const term of bodyTerms) freq.set(term, (freq.get(term) || 0) + 1);

    for (const term of new Set([...bodyTerms, ...titleTerms])) {
      df.set(term, (df.get(term) || 0) + 1);
    }

    totalLength += bodyTerms.length;
    return { ...entry, freq, titleTerms, length: bodyTerms.length };
  });

  // Yung mga salita sa title ng passage, sila yung mismong topics na tinuturo
  // ng platform, kaya sila yung tamang target para sa typo correction.
  const topicTerms = new Set();
  for (const entry of prepared) {
    for (const term of entry.titleTerms) topicTerms.add(term);
  }

  index = {
    entries: prepared,
    df,
    rawVocab,
    topicTerms,
    avgLength: prepared.length ? totalLength / prepared.length : 0,
  };
  return index;
}

/** Ibinabalik yung mga passage na pinaka-relevant sa tanong, best-first. */
function search(question, limit = 4) {
  const { entries, df, rawVocab, topicTerms, avgLength } = loadIndex();
  if (!entries.length) return [];

  // Sinusubukan muna yung salita mismo bago pinaikli. Kailangan to kasi
  // minsan sobrang ikli na ng pinaikling salita para magkatugma: "phising"
  // nagiging "phi" pagkatapos alisin yung "ing" tsaka "s", pero kumpara sa
  // buong salita, isang palit lang ang layo niya sa "phishing".
  const correct = (word) => {
    const stemmed = stem(word);
    if (df.has(stemmed)) return stemmed;
    // Isang palit lang ang pinapayagan dito. Kapag dalawa, kung ano-ano na ang
    // pinipilit magkatugma: "manila" naging "manual", tapos parang may
    // kinalaman na sa modules natin yung tanong tungkol sa pizza.
    const nearRaw = nearestKnownTerm(word, rawVocab, 1);
    if (nearRaw !== word) return stem(nearRaw);
    return nearestKnownTerm(stemmed, topicTerms);
  };

  const queryTerms = [...new Set(tokenise(question).map(correct))];
  if (!queryTerms.length) return [];

  const N = entries.length;
  const k1 = 1.5;   // bilis ng pag-level off pag paulit-ulit yung term
  const b = 0.75;   // gaano ka-penalized yung length ng passage

  // Mas malakas na signal yung term sa title kesa sa body, kaya dagdag
  // weight to.
  const TITLE_WEIGHT = 2.5;

  const vocabCoverage = Number(
    (queryTerms.filter((t) => df.has(t)).length / queryTerms.length).toFixed(2)
  );

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

    // Kung ilang query terms tumama sa title, tungkol talaga dun yung
    // passage, hindi lang nabanggit. Kung wala to, isang malakas na term lang
    // pwede mag-outrank sa passage na mas kumpletong tugma.
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
      // Ilang bahagi ng tanong ang may salitang nasa materials natin kahit
      // saan. Kapag mas marami ang wala talaga, labas sa topic yung tanong:
      // "best pizza in manila" tumatama sa quiz question na nagsisimula sa
      // "What is the best...", pero ang "pizza" at "manila" ay wala kahit
      // saang module. Iba yun sa "how do I secure my home wifi", na lahat ng
      // salita ay nasa materials kahit iisa lang tumama sa top passage.
      vocabCoverage,
    }));
}

function isReady() {
  return loadIndex().entries.length > 0;
}

// Pangalan mismo ng mga paksa. Hindi puwedeng basta lahat ng salita sa mga
// title, kasi pati "prevent" at "attack" kasama dun, tapos ang lahat ng tanong
// magmumukhang may sariling paksa.
const TOPIC_WORDS = [
  'phishing', 'quishing', 'smishing', 'vishing', 'pretexting', 'spear',
  'password', 'passwords', 'recruiter', 'recruiters', 'invoice', 'invoices',
  'impersonation', 'deepfake', 'deepfakes', 'wifi', 'router', 'mfa', 'otp',
  'ransomware', 'malware', 'scam', 'scams',
];
const TOPIC_NAMES = new Set(TOPIC_WORDS.map(stem));

// Totoo kapag pangalan ng paksa mismo ang nasa tanong, kahit may typo
// ("phising"). Isang palit lang ang pinapayagan; kapag dalawa, ibang salita na
// yun: "prevent" at "pretext" dalawa ang layo, hindi dapat magkatugma.
function mentionsTopic(text) {
  // Pati yung buong salita sinusuri, hindi lang yung pinaikli. Kasi
  // "phising" nagiging "phi" pagkatapos alisin yung "ing" tsaka "s", masyado
  // nang malayo kay "phish" para magkatugma.
  const near = (word, names) => {
    if (names.has(word)) return true;
    if (word.length < 4) return false;
    for (const name of names) {
      if (word[0] === name[0] && editDistance(word, name, 1) <= 1) return true;
    }
    return false;
  };
  const rawNames = new Set(TOPIC_WORDS);
  return tokenise(text).some((word) => near(word, rawNames) || near(stem(word), TOPIC_NAMES));
}

module.exports = { search, isReady, mentionsTopic };
