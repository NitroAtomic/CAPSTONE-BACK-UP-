// scripts/build-knowledge-base.js
// Backend and integration: IamAtomic
//
// Builds the assistant's knowledge base from the platform's own content, so
// answers come from the modules rather than from the model's general
// knowledge.
//
// Run it with:  npm run kb:build
//
// Sources: the six free module pages, the role-based module content, and the
// explanations attached to quiz and assessment questions. Those explanations
// are worth including because each one is already a short, self contained
// answer to a specific question.
//
// Output is a plain JSON file committed alongside the code. No vector
// database and no embedding step, which means nothing to keep running and
// nothing that empties when a service restarts.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, '..', 'data', 'knowledge-base.json');

/** Strips tags, scripts and styles out of a page and returns readable text. */
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

/** Splits text into chunks of roughly `size` words, keeping whole sentences
 *  together so a chunk never ends mid-thought. */
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

// 1. The six free module pages.
//
// Split on the section headings rather than treating each page as one block.
// Without this, every chunk from a page shares a single vague title while the
// role-based modules carry descriptive ones like "Red flags", which skews
// retrieval towards the latter for no good reason.
const modulesDir = path.join(ROOT, 'modules');
if (fs.existsSync(modulesDir)) {
  for (const file of fs.readdirSync(modulesDir).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(modulesDir, file), 'utf8');

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const moduleName = (titleMatch ? titleMatch[1] : file)
      .replace(/\s*[|-].*$/, '')
      .replace(/^Module\s*\d+:\s*/i, '')
      .trim();

    // Split the body at each h2/h3 so a section's heading travels with it.
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

// 3. Quiz explanations. Each is already a direct answer to a real question,
//    so the question is kept with it rather than being thrown away.
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

  // 4. Assessment explanations, same reasoning.
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
