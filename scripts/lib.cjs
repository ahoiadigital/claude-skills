// Shared helpers for the repo scripts: find skills and read their metadata.
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const SKILLS = path.join(ROOT, 'skills');

function frontmatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return null;
  const out = {};
  for (const line of text.slice(4, end).split('\n')) {
    const m = line.match(/^([a-z_-]+):\s*(.*)$/i);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}
function yamlInterface(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s+([a-z_]+):\s*"(.*)"\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
function titleOf(readme, fallback) {
  const m = readme && readme.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}
// every skills/<category>/<skill>/SKILL.md, sorted by category then name
function listSkills() {
  const out = [];
  for (const category of fs.readdirSync(SKILLS).sort()) {
    const cdir = path.join(SKILLS, category);
    if (!fs.statSync(cdir).isDirectory()) continue;
    for (const name of fs.readdirSync(cdir).sort()) {
      const dir = path.join(cdir, name), file = path.join(dir, 'SKILL.md');
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, 'utf8');
      const agents = path.join(dir, 'agents', 'openai.yaml');
      const ui = fs.existsSync(agents) ? yamlInterface(fs.readFileSync(agents, 'utf8')) : {};
      const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
      const has = p => fs.existsSync(path.join(dir, p));
      out.push({
        category, name, dir, rel: rel(dir), fm: frontmatter(text) || {}, ui,
        display: ui.display_name || name, short: ui.short_description || '',
        demo: has('demo/index.html') ? rel(path.join(dir, 'demo/index.html')) : null,
        preview: has('demo/preview.jpg') ? rel(path.join(dir, 'demo/preview.jpg')) : null,
        prompt: has('demo/PROMPT.md') ? rel(path.join(dir, 'demo/PROMPT.md')) : null,
      });
    }
  }
  return out;
}
function categories(skills) {
  const cats = [...new Set(skills.map(s => s.category))];
  return cats.map(c => {
    const readme = path.join(SKILLS, c, 'README.md');
    const text = fs.existsSync(readme) ? fs.readFileSync(readme, 'utf8') : '';
    return { id: c, title: titleOf(text, c[0].toUpperCase() + c.slice(1)), readme, text, skills: skills.filter(s => s.category === c) };
  });
}
function replaceBetween(text, tag, body) {
  const a = `<!-- ${tag}:start -->`, b = `<!-- ${tag}:end -->`;
  const i = text.indexOf(a), j = text.indexOf(b);
  if (i < 0 || j < i) return null;
  return text.slice(0, i + a.length) + '\n' + body.trim() + '\n' + text.slice(j);
}
module.exports = { ROOT, SKILLS, listSkills, categories, replaceBetween, frontmatter, yamlInterface };
