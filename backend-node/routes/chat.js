// routes/chat.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
//
// Yung learning assistant.
//
// Dalawang mode, tapos yung fallback yung mahalaga. May AI provider naka-
// configure (n8n webhook o Gemini), diretso doon ang message. Kung wala,
// sumasagot base sa curated na topics galing mismo sa modules ng platform.
//
// Meron nito para hindi "hindi pa connected" lang lagi yung sagot ng chat —
// mas mabuti pa yun kesa walang chat, at hiwalay na trabaho yung prompt
// engineering para sa live provider. Kaya gumagana pa rin talaga to habang
// wala pang totoong provider, hindi lang nagkukunwari.

const express = require('express');
const config = require('./../config/env');
const retrieval = require('./../config/retrieval');

const router = express.Router();

// Curated na sagot para sa itinuturo ng anim na Free modules. Keyword
// matching lang to, walang kalokohan, honest naman kung ano to.
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

  // Piliin yung topic na pinaka-maraming keyword match, para kung ilang term
  // nabanggit sa tanong, sa pinaka-relevant to na sagot mapunta.
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

// I-redact yung mukhang shared password bago ito umalis sa server na to, third
// party AI provider man (n8n/Gemini) o log line. Yung sariling advice ng
// platform natin "never share a password over chat" (tignan yung KNOWLEDGE
// entry sa taas) — kaya kung ipapasa natin yung totoong password ng user sa
// external API dahil na-type nila dito, mismong yung mistake na tinuturuan
// nating iwasan yun.
const PASSWORD_PATTERN = /\b(pass(?:word)?|pwd)\b(\s*[:=]|\s+is)?\s*["']?([^\s"',.!?]{3,})["']?/gi;

function redactSecrets(text) {
  return text.replace(PASSWORD_PATTERN, (match, label, connector = '') => `${label}${connector} [REDACTED]`);
}

const FALLBACK =
  "I do not have a prepared answer for that one. I can help with phishing, quishing, spear phishing, smishing, vishing, pretexting, passwords, multi-factor authentication, invoice and payment scams, recruitment scams, and securing a home network.\n\nThe six free modules cover all of these in more depth.";

router.post('/', async (req, res) => {
  const { message: rawMessage } = req.body;

  if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
    return res.status(400).json({ error: 'A message is required.' });
  }
  if (rawMessage.length > 1000) {
    return res.status(400).json({ error: 'That message is too long.' });
  }

  // Mula dito, redacted text na yung gagamitin — to yung ipapadala sa kahit
  // anong third-party provider, tutugma sa local keywords, at dito pupunta
  // yung log line kung magkakaroon man.
  const message = redactSecrets(rawMessage);

  // Hanapin yung passages sa sariling modules natin na pinaka-tugma sa tanong.
  // Sila yung sasagutan ng model, para itinuturo ng assistant yung material ng
  // platform, hindi yung basta alam niya lang.
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

  // Sariling prompt at knowledge base yung n8n, kaya diretso lang ipapasa
  // yung tanong, hindi na babalutin ng sarili nating prompt.
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
      // Nagre-retire ng model names si Google paminsan-minsan, tapos 404 na
      // may pangalan ng replacement yung ibabalik ng API. Tignan yung backend
      // log kung nagsimulang bumagsak sa knowledge base yung assistant.
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
              // Nag-iisip muna si Gemini 3.x bago sumagot, kasama sa budget na
              // to yung thinking tokens. Sa 400, naubos lahat sa reasoning
              // tapos putol yung reply pagdating.
              maxOutputTokens: 2048,
              // Hindi na kailangan mag-isip para lang mag-summarize ng
              // passage na nakuha na natin, kaya naka-off na lang. Mas mabilis,
              // tapos buo yung budget na maiipon para sa reply.
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );
      const data = await upstream.json();
      const candidate = data?.candidates?.[0];
      const reply = candidate?.content?.parts?.[0]?.text;

      // MAX_TOKENS ibig sabihin naputol yung sagot. Mas okay bumalik sa module
      // text, kumpleto naman kahit paano, kesa ipakita kalahating sentence.
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

  // Walang naka-configure na provider, o nag-fail. Sagutin galing sa
  // nakuhang passage mismo. Module text talaga to, kaya medyo formal magbasa,
  // pero tama naman at sarili natin.
  // May floor sa score, kasi diretso na ipapasa yung passage sa user, walang
  // nag-che-check kung bagay ba talaga. Yung totoong tanong, mataas naman
  // ang score dyan; yung stray keyword lang, mababa. May AI provider naman,
  // hindi na masama yung mahinang match, kasi sinasabihan naman yung model na
  // aminin kung wala talagang tugma.
  const MIN_DIRECT_SCORE = 5.5;

  if (passages.length && passages[0].score >= MIN_DIRECT_SCORE) {
    return res.json({
      reply: passages[0].text,
      source: 'knowledge-base',
      sources: [passages[0].title],
    });
  }

  // Walang tumugma talaga.
  const curated = findAnswer(message);
  res.json({ reply: curated || FALLBACK, source: 'local' });
});

module.exports = router;
