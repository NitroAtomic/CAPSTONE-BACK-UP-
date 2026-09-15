import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/')
}

function htmlToVueBody(html, { quizPath, completionHome }) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (!bodyMatch) throw new Error('No body found')
  let body = bodyMatch[1]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<header>/, '<header class="module-header">')
    .replace(
      /<a href="\.\.\/index\.html" class="home">/,
      '<router-link to="/" class="home">'
    )
    .replace(/<\/a>(\s*<\/nav>)/, '</router-link>$1')
    .replace(/src="\.\.\/images\//g, 'src="/images/')
    .replace(/src="images\//g, 'src="/images/')
    .replace(/20-question quiz/g, '10-question quiz')

  if (quizPath) {
    body = body.replace(
      /<a\s+href="\.\.\/quiz\/module-\d+\/easy\/question-1\.html"\s+class="take-quiz-button"\s*>\s*Take a Quiz\s*<\/a>/,
      `<router-link to="${quizPath}" class="take-quiz-button">\n            Take a Quiz\n        </router-link>`
    )
  }

  if (completionHome) {
    body += `
    <section class="module-quiz-section">
        <h2>Module complete</h2>
        <p>
            This foundational module has no quiz. Return to the homepage to continue with the remaining free modules.
        </p>
        <router-link to="/" class="take-quiz-button">
            Back to Home
        </router-link>
    </section>
`
  }

  return body.trim()
}

const moduleMap = [
  {
    html: 'modules/quishing.html',
    vue: 'javascript/framework/vue/modules/Quishing.vue',
    js: 'javascript/framework/vue/modules/Quishing.js',
    name: 'Quishing',
    quizPath: '/quiz/module-1/question'
  },
  {
    html: 'modules/spear-phishing.html',
    vue: 'javascript/framework/vue/modules/SpearPhishing.vue',
    js: 'javascript/framework/vue/modules/SpearPhishing.js',
    name: 'SpearPhishing',
    quizPath: '/quiz/module-2/question'
  },
  {
    html: 'modules/smishing.html',
    vue: 'javascript/framework/vue/modules/Smishing.vue',
    js: 'javascript/framework/vue/modules/Smishing.js',
    name: 'Smishing',
    quizPath: '/quiz/module-3/question'
  },
  {
    html: 'modules/vishing.html',
    vue: 'javascript/framework/vue/modules/Vishing.vue',
    js: 'javascript/framework/vue/modules/Vishing.js',
    name: 'Vishing',
    quizPath: '/quiz/module-4/question'
  },
  {
    html: 'modules/pretexting.html',
    vue: 'javascript/framework/vue/modules/Pretexting.vue',
    js: 'javascript/framework/vue/modules/Pretexting.js',
    name: 'Pretexting',
    quizPath: '/quiz/module-5/question'
  },
  {
    html: 'modules/essential-safe-practices-remote-environments.html',
    vue: 'javascript/framework/vue/modules/EssentialSafePracticesRemoteEnv.vue',
    js: 'javascript/framework/vue/modules/EssentialSafePracticesRemoteEnv.js',
    name: 'EssentialSafePracticesRemoteEnv',
    quizPath: null,
    completionHome: true
  }
]

for (const item of moduleMap) {
  const html = fs.readFileSync(path.join(root, item.html), 'utf8')
  const body = htmlToVueBody(html, item)
  const vue = `<template>
  <main class="module-page">
    ${body}
  </main>
</template>

<script src="./${path.basename(item.js)}"></script>
`
  fs.writeFileSync(path.join(root, item.vue), vue)
  fs.writeFileSync(
    path.join(root, item.js),
    `export default {\n  name: '${item.name}'\n}\n`
  )
}

const htmlFiles = walk(root).filter((file) => file.endsWith('.html'))

for (const file of htmlFiles) {
  let text = fs.readFileSync(file, 'utf8')
  const original = text
  const rel = toPosix(path.relative(root, file))

  text = text.replace(/src="\.\.\/images\//g, 'src="/images/')
  text = text.replace(/src="images\//g, 'src="/images/')
  text = text.replace(/src="\.\.\/public\/images\//g, 'src="/images/')
  text = text.replace(/src="public\/images\//g, 'src="/images/')
  text = text.replace(/20-question quiz/g, '10-question quiz')

  if (rel.startsWith('quiz/')) {
    text = text.replace(
      /<a href="#" class="btn btn-login">Log in<\/a>/g,
      '<a href="../../../login.html" class="btn btn-login">Log in</a>'
    )
  }

  if (rel === 'login.html') {
    text = text.replace(
      '<a href="#">Create an account</a>',
      '<a href="create-account.html">Create an account</a>'
    )
  }

  if (text !== original) fs.writeFileSync(file, text)
}

console.log('Aligned HTML paths and generated Vue module pages.')
