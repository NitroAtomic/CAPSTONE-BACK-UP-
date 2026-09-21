// scripts/build-knowledge-base.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
//
// Ginagawa yung knowledge base ng assistant galing sa sariling content ng
// platform, para galing dito yung sagot, hindi sa general knowledge ng model.
//
// Patakbuhin gamit:  npm run kb:build
//
// Sources: yung anim na Free module pages, yung role-based module content, at
// yung mga explanation na nakalagay sa quiz at assessment questions. Isinama
// yung mga explanation kasi bawat isa maikli at self-contained na sagot na
// sa sariling tanong niya.
//
// Plain JSON file lang yung output, committed kasama code. Walang vector
// database, walang embedding step — walang patatakbuhin, walang nawawala pag
// nag-restart.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, '..', 'data', 'knowledge-base.json');

/** Tinatanggal yung tags, scripts, at styles sa page, ibinabalik yung
 *  readable text. */
function textFromHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|section|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '-')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

/** Hinahati yung text sa chunks na mga `size` words, buo pa rin yung sentence
 *  para hindi maputol yung thought sa gitna. */
function chunk(text, title, source, size = 110) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
  const chunks = [];
  let current = [];
  let count = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (count + words > size && current.length) {
      chunks.push({ title, source, text: current.join(' ').trim() });
      current = [];
      count = 0;
    }
    current.push(sentence);
    count += words;
  }
  if (current.length) chunks.push({ title, source, text: current.join(' ').trim() });

  return chunks.filter((c) => c.text.split(/\s+/).length > 15);
}

const entries = [];

// 1. Yung anim na Free module pages.
//
// Hinati sa section headings, hindi isang page = isang block. Kung hindi
// ganito, iisang vague na title lang share ng bawat chunk ng page, samantalang
// descriptive naman yung title ng role-based modules gaya ng "Red flags" —
// kaya na-bias yung retrieval papunta doon nang walang dahilan.
const modulesDir = path.join(ROOT, 'modules');
if (fs.existsSync(modulesDir)) {
  for (const file of fs.readdirSync(modulesDir).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(modulesDir, file), 'utf8');

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const moduleName = (titleMatch ? titleMatch[1] : file)
      .replace(/\s*[|-].*$/, '')
      .replace(/^Module\s*\d+:\s*/i, '')
      .trim();

    // Hatiin yung body sa bawat h2/h3, para sabay dala yung heading ng section.
    const parts = html.split(/<h[23][^>]*>/i);
    let carriedHeading = null;

    for (const part of parts) {
      const headingEnd = part.indexOf('<');
      const heading = headingEnd > 0 ? part.slice(0, headingEnd).trim() : null;
      const bodyText = textFromHtml(headingEnd > 0 ? part.slice(headingEnd) : part);

      if (!bodyText) { carriedHeading = heading || carriedHeading; continue; }

      const label = heading && heading.length < 90
        ? `${moduleName}: ${heading}`
        : moduleName;

      entries.push(...chunk(bodyText, label, `modules/${file}`));
      carriedHeading = heading || carriedHeading;
    }
  }
}

// 2. Role-based module content.
const premiumPath = path.join(ROOT, 'javascript', 'framework', 'vue', 'data', 'premium-modules.json');
if (fs.existsSync(premiumPath)) {
  const data = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
  for (const mod of data.modules) {
    for (const section of mod.sections) {
      entries.push(...chunk(section.body, `${mod.title}: ${section.heading}`, 'role-based modules'));
    }
  }
}

// 3. Quiz explanations. Direktang sagot na to sa totoong tanong, kaya kasama
//    na rin yung tanong, hindi tinapon.
const dataDir = path.join(ROOT, 'javascript', 'framework', 'vue', 'data');
if (fs.existsSync(dataDir)) {
  for (const file of fs.readdirSync(dataDir).filter((f) => f.startsWith('module-'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    for (const q of data.questions || []) {
      if (!q.explanation) continue;
      entries.push({
        title: data.moduleName,
        source: `quiz/${file}`,
        text: `${q.questionText} ${q.explanation}`,
      });
    }
  }

  // 4. Assessment explanations, same lang na dahilan.
  const assessPath = path.join(dataDir, 'assessment.json');
  if (fs.existsSync(assessPath)) {
    const data = JSON.parse(fs.readFileSync(assessPath, 'utf8'));
    for (const q of data.questions || []) {
      if (!q.explanation) continue;
      entries.push({
        title: data.topics[q.topic] || q.topic,
        source: 'assessment',
        text: `${q.questionText} ${q.explanation}`,
      });
    }
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ builtAt: new Date().toISOString(), entries }, null, 2));

const words = entries.reduce((n, e) => n + e.text.split(/\s+/).length, 0);
console.log(`Knowledge base built: ${entries.length} passages, about ${words} words.`);
console.log(`Written to ${path.relative(ROOT, OUT)}`);
