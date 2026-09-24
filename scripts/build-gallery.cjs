// node scripts/build-gallery.cjs
// Regenerates DEMOS.md, SCREENSHOTS.md and SCREENSHOTS.html from the skills tree, and
// refreshes the generated lists in README.md and each skills/<category>/README.md
// (between their <!-- library:start/end --> and <!-- skills:start/end --> markers).
const fs = require('node:fs'), path = require('node:path');
const { ROOT, listSkills, categories, replaceBetween } = require('./lib.cjs');
const skills = listSkills(), cats = categories(skills);
const withDemo = skills.filter(s => s.demo);
const w = (f, t) => { fs.writeFileSync(path.join(ROOT, f), t); console.log('wrote', f); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- README library ----------
const readme = path.join(ROOT, 'README.md');
const lib = [`This snapshot contains **${skills.length} skills** across ${cats.length} ${cats.length === 1 ? 'category' : 'categories'}. \`find skills -name SKILL.md | sort\` is the source of truth.`, '']
  .concat(...cats.map(c => [`### ${c.title} (${c.skills.length})`, '', `[Category guide](skills/${c.id}/README.md)`, '',
    ...c.skills.map(s => `- [\`${s.name}\`](${s.rel}/SKILL.md) - ${s.short || s.fm.description.split('. ')[0]}`), ''])).join('\n');
const r = replaceBetween(fs.readFileSync(readme, 'utf8'), 'library', lib);
if (r) w('README.md', r); else console.log('README.md: no library markers, left alone');

// ---------- category READMEs ----------
for (const c of cats) {
  if (!c.text) continue;
  const table = ['| Skill | Use it for |', '| --- | --- |', ...c.skills.map(s => `| [${s.display}](${s.name}/SKILL.md) | ${s.short} |`)].join('\n');
  const t = replaceBetween(c.text, 'skills', table);
  if (t) w(path.relative(ROOT, c.readme), t);
}

// ---------- DEMOS.md ----------
w('DEMOS.md', `# Skill Demos

Every visual skill has a portable demo, a rendered preview and the exact prompt to recreate or remix it.

## Folder contract

\`\`\`text
skills/<category>/<skill-name>/
  demo/
    index.html     # standalone page: inline CSS, relative paths, no build step
    PROMPT.md      # minimal, recreation and remix prompts
    preview.jpg    # 1280 x 720 browser render
\`\`\`

A demo may load the skill's own files from \`../assets/\`, so the skill folder stays the unit you copy.

## Run a demo

Open \`demo/index.html\` straight in a browser, or serve the skill folder:

\`\`\`bash
python3 -m http.server 4173 -d skills/<category>/<skill-name>
\`\`\`

Then visit http://localhost:4173/demo/.

## Rebuild

\`\`\`bash
node scripts/build-previews.cjs      # render demo/preview.jpg (needs puppeteer)
node scripts/build-gallery.cjs       # this file, SCREENSHOTS.md/.html, README lists
node scripts/validate-skills.cjs     # check every skill against the folder contract
\`\`\`

## Library coverage

- Total: ${skills.length}
- With demos: ${withDemo.length}
${cats.map(c => `- ${c.id}: ${c.skills.length}`).join('\n')}

## Demo index

| Skill | Category | Demo | Preview | Prompt |
| --- | --- | --- | --- | --- |
${withDemo.map(s => `| ${s.name} | ${s.category} | [Open](${s.demo}) | [Preview](${s.preview || s.demo}) | [Prompt](${s.prompt}) |`).join('\n')}
`);

// ---------- SCREENSHOTS.md ----------
w('SCREENSHOTS.md', `# Demo Screenshot Gallery

Every demo, rendered in a real browser at 1280 x 720. See [DEMOS.md](DEMOS.md) for how to run and rebuild them, or open the [visual gallery](SCREENSHOTS.html) locally.

- Captured demos: ${withDemo.filter(s => s.preview).length}
- Format: JPEG

${cats.map(c => `## ${c.id} (${c.skills.filter(s => s.preview).length})

${c.skills.filter(s => s.preview).map(s => `### ${s.name}

${s.fm.description}

[Open demo](${s.demo}) · [Skill](${s.rel}/SKILL.md) · [Prompt](${s.prompt})

![${s.name} preview](${s.preview})
`).join('\n')}`).join('\n')}`);

// ---------- SCREENSHOTS.html ----------
w('SCREENSHOTS.html', `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skill Gallery</title>
<style>
  :root { --bg: #F1F4EE; --ink: #161B17; --dim: rgba(22,27,23,.6); --card: #fff; --line: rgba(22,27,23,.12); }
  @media (prefers-color-scheme: dark) { :root { --bg: #111412; --ink: #EEF1EA; --dim: rgba(238,241,234,.6); --card: #1A1E1B; --line: rgba(238,241,234,.12); } }
  * { box-sizing: border-box; margin: 0; }
  body { background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, -apple-system, sans-serif; padding: 48px 16px 80px; }
  main { max-width: 1240px; margin: 0 auto; }
  h1 { font-size: clamp(28px, 4vw, 44px); letter-spacing: -.02em; }
  .sub { color: var(--dim); margin: 6px 0 36px; }
  h2 { font-size: 13px; letter-spacing: .2em; text-transform: uppercase; color: var(--dim); margin: 36px 0 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
  a.card { display: block; background: var(--card); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; color: inherit; text-decoration: none; }
  a.card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
  .meta { padding: 12px 14px 14px; }
  .meta b { display: block; font-weight: 600; }
  .meta span { color: var(--dim); font-size: 13px; }
</style>
</head>
<body>
<main>
  <h1>Skill Gallery</h1>
  <p class="sub">${withDemo.length} demos across ${cats.length} ${cats.length === 1 ? 'category' : 'categories'}. Click a card to open the live demo.</p>
${cats.map(c => `  <h2>${esc(c.title)}</h2>
  <div class="grid">
${c.skills.filter(s => s.preview).map(s => `    <a class="card" href="${esc(s.demo)}"><img src="${esc(s.preview)}" alt="${esc(s.name)} preview" loading="lazy"><div class="meta"><b>${esc(s.display)}</b><span>${esc(s.short)}</span></div></a>`).join('\n')}
  </div>`).join('\n')}
</main>
</body>
</html>
`);
