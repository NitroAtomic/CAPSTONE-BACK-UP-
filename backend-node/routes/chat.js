// routes/chat.js
// Backend and integration: IamAtomic
//
// The learning assistant.
//
// Two modes, and the fallback is the important one. With an AI provider
// configured (n8n webhook or Gemini) the message is proxied to it. Without
// one, the assistant answers from a curated set of topics drawn from the
// platform's own modules.
//
// That fallback exists because a chat window that replies "not connected yet"
// to every question is worse than no chat window at all, and because the
// prompt engineering for the live provider is a separate piece of work. This
// keeps the feature genuinely usable in the meantime without pretending to be
// something it is not.

const express = require('express');
const config = require('./../config/env');
const retrieval = require('./../config/retrieval');

const router = express.Router();

// Curated answers covering what the six free modules teach. Matching is on
// keywords rather than anything clever, which is honest about what this is.
const KNOWLEDGE = [
  {
    keywords: ['quishing', 'qr', 'qr code'],
    answer:
      'Quishing hides a malicious link inside a QR code. Email security tools scan text links but not images, so the code slips past them, and scanning it on your phone moves you outside whatever protection your work machine has.\n\nTreat an unsolicited QR code in an email the same way you would treat an unexpected link: do not scan it. If it claims to be from a service you use, open that service yourself instead.'
  },
  {
    keywords: ['phishing', 'phish', 'fake email', 'suspicious email'],
    answer:
      'Phishing is a message built to look like it came from someone you trust, aiming to get a password, a payment, or a click.\n\nThe signals worth checking: does the sender domain match exactly, is there urgency pushing you to act now, and does the link destination match the text shown. Hovering over a link reveals where it actually goes.\n\nHTTPS and a padlock mean the connection is encrypted, not that the site is genuine. Anyone can get a certificate for a lookalike domain.'
  },
  {
    keywords: ['spear', 'targeted', 'spear phishing'],
    answer:
      'Spear phishing is aimed at you specifically. The attacker researches you first, usually from public profiles, so the message references your real projects, clients, or colleagues.\n\nBecause the details are right, the usual signals are missing. What stays reliable is verifying through a channel you already use, rather than replying to the message itself.'
  },
  {
    keywords: ['smishing', 'sms', 'text message', 'text scam'],
    answer:
      'Smishing is phishing by text message. It works well because people trust SMS more than email, and a small screen hides the full web address.\n\nThe firmest rule: no legitimate organisation will ever ask you to reply with a one time code. That code exists to prove you are you, so anyone asking for it is trying to finish a login they started.'
  },
  {
    keywords: ['vishing', 'phone call', 'voice', 'caller'],
    answer:
      'Vishing is a scam phone call. Caller ID can be spoofed, so a number matching your bank or IT desk proves nothing.\n\nTwo requests should end the call: approving a login prompt you did not trigger, and installing remote access software like AnyDesk or TeamViewer. Hang up and call back on a number you already had, not one the caller gives you.'
  },
  {
    keywords: ['pretexting', 'pretext', 'impersonat'],
    answer:
      'Pretexting is building a believable role before asking for anything. An attacker might spend days appearing to be an auditor, a new vendor, or a contractor, so that by the time the request arrives it feels routine.\n\nOne tell is consistent: they steer away from official channels. A ticketing system creates a record and verifies identity, which is exactly what they need to avoid.'
  },
  {
    keywords: ['mfa', '2fa', 'two factor', 'authenticator', 'otp'],
    answer:
      'Use an authenticator app or a hardware key rather than SMS codes. Text messages can be intercepted or redirected through a SIM swap, while app based codes stay on a device you physically hold.\n\nNever share a one time code with anyone, regardless of who they claim to be.'
  },
  {
    keywords: ['password', 'passwords', 'password manager'],
    answer:
      'Use a different password for every account and a password manager to hold them. Length matters more than complexity, so a long passphrase beats a short string of symbols.\n\nIf a password has ever been shared over chat, treat it as compromised and change it. It stays in that history permanently.'
  },
  {
    keywords: ['invoice', 'payment', 'bank details', 'client payment'],
    answer:
      'Any change to payment details should be confirmed by voice on a number you already had, before anything is sent. Attackers rely on this feeling awkward to ask about.\n\nPayment confirmations are easy to fake, since provider email templates are public and a screenshot proves nothing. The only reliable check is logging into the payment provider yourself and seeing the transaction.'
  },
  {
    keywords: ['wifi', 'router', 'home network'],
    answer:
      'Change the router admin password from its default, since defaults are published. Turn off remote management so the router is not reachable from the internet, use WPA3 or WPA2 encryption, and keep smart home devices on a separate guest network so a compromised one cannot reach your work machine.'
  },
  {
    keywords: ['recruiter', 'job offer', 'hiring', 'job scam'],
    answer:
      'Two things mark a recruitment scam: identity documents requested before any contract exists, and any request for money from you, whether for equipment, training, or fees.\n\nVerify the company through details you find yourself rather than ones in the message, and hold back passport or ID scans until a signed contract is in place with an organisation you have confirmed.'
  },
  {
    keywords: ['verify', 'verification', 'out of band', 'confirm'],
    answer:
      'Out of band verification means confirming a request through a different channel than the one it arrived on.\n\nIf the request is fake, the channel it came through is controlled by the attacker, so replying to ask "is this really you?" only ever gets a yes. Calling a number you already had is what makes the check independent.'
  }
];

function findAnswer(message) {
  const text = String(message).toLowerCase();

  // Prefer the topic matching the most keywords, so a question mentioning
  // several terms lands on the most relevant one.
  let best = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE) {
    const score = entry.keywords.filter((k) => text.includes(k)).length;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return best ? best.answer : null;
}

const FALLBACK =
  "I do not have a prepared answer for that one. I can help with phishing, quishing, spear phishing, smishing, vishing, pretexting, passwords, multi-factor authentication, invoice and payment scams, recruitment scams, and securing a home network.\n\nThe six free modules cover all of these in more depth.";

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'A message is required.' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'That message is too long.' });
  }

  // Find the passages from our own modules that best match the question.
  // These are what the model is asked to answer from, so the assistant
  // teaches the platform's material rather than improvising from whatever
  // it happens to know.
  const passages = retrieval.search(message, 4);

  const context = passages
    .map((p, i) => `[${i + 1}] ${p.title}\n${p.text}`)
    .join('\n\n');

  const SYSTEM_PROMPT = [
    'You are CyberWise, the learning assistant for a social engineering awareness platform aimed at remote workers, freelancers and virtual assistants.',
    '',
    'Answer using the reference passages below. They are taken from the platform\'s own learning modules.',
    '',
    'Rules:',
    '- Answer only from the passages when they cover the question.',
    '- If they do not cover it, say so plainly and name which topics you can help with. Do not invent specifics.',
    '- Keep answers short and practical, a few sentences at most.',
    '- Write plainly, no bullet lists unless the answer is genuinely a list.',
    '- Refuse anything unrelated to security awareness.',
    '',
    'Reference passages:',
    context || '(none matched this question)'
  ].join('\n');

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  const geminiKey = process.env.GEMINI_API_KEY;

  // n8n owns its own prompt and knowledge base, so the question goes across
  // untouched rather than being wrapped in ours.
  if (n8nUrl) {
    try {
      const upstream = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await upstream.json();
      const reply = data.reply || data.output;
      if (reply) return res.json({ reply, source: 'n8n' });
    } catch (err) {
      console.warn('[chat] n8n unreachable, falling back:', err.message);
    }
  }

  if (geminiKey) {
    try {
      // Google retires model names periodically, and the API returns a 404
      // naming the replacement when that happens. Check the backend log if
      // the assistant starts falling back to the knowledge base.
      const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: {
              temperature: 0.3,
              // Gemini 3.x reasons before answering, and those thinking
              // tokens count against this budget. At 400 the reasoning
              // consumed it all and replies arrived cut off mid-sentence.
              maxOutputTokens: 2048,
              // No reasoning needed to summarise a passage we already
              // retrieved, so it is switched off. Faster, and it keeps the
              // whole budget available for the reply.
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );
      const data = await upstream.json();
      const candidate = data?.candidates?.[0];
      const reply = candidate?.content?.parts?.[0]?.text;

      // MAX_TOKENS means the answer was cut off. Better to fall back to the
      // module text, which is at least complete, than show half a sentence.
      if (candidate?.finishReason === 'MAX_TOKENS') {
        console.warn('[chat] Gemini hit the token limit; falling back to the knowledge base.');
      } else if (reply) {
        return res.json({
          reply: reply.trim(),
          source: 'gemini',
          sources: passages.map((p) => p.title),
        });
      }
      console.warn('[chat] Gemini returned no text:', JSON.stringify(data).slice(0, 200));
    } catch (err) {
      console.warn('[chat] Gemini unreachable, falling back:', err.message);
    }
  }

  // No provider configured, or it failed. Answer from the retrieved passage
  // directly. It is the module text rather than a generated reply, so it
  // reads a little formally, but it is accurate and it is ours.
  // A floor on the score, because this path hands the passage straight to the
  // user with nothing in between to judge whether it fits. Real questions
  // score well above this; a stray keyword match scores below it. With an AI
  // provider configured the same weak match is harmless, since the model is
  // told to say when the passages do not cover the question.
  const MIN_DIRECT_SCORE = 5.5;

  if (passages.length && passages[0].score >= MIN_DIRECT_SCORE) {
    return res.json({
      reply: passages[0].text,
      source: 'knowledge-base',
      sources: [passages[0].title],
    });
  }

  // Nothing matched at all.
  const curated = findAnswer(message);
  res.json({ reply: curated || FALLBACK, source: 'local' });
});

module.exports = router;
