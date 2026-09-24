// node scripts/build-previews.cjs [skill-name ...]
// Renders every skill's demo/index.html to demo/preview.jpg (1280 x 720), then
// composes up to nine previews into assets/skills-preview.jpg for the README.
// A demo can define window.__demoPose() to set up the frame worth showing
// (the gooey demos use it to freeze an edge mid-pull). Needs puppeteer:
//   npm i --no-save puppeteer   (or point NODE_PATH at an install that has it)
const fs = require('node:fs'), path = require('node:path'), { pathToFileURL } = require('node:url');
let puppeteer;
try { puppeteer = require('puppeteer'); } catch { console.error('puppeteer not found: npm i --no-save puppeteer, or set NODE_PATH'); process.exit(1); }
const root = path.resolve(__dirname, '..', 'skills');
const only = process.argv.slice(2);
const demos = [];
for (const cat of fs.readdirSync(root)) for (const s of fs.existsSync(path.join(root, cat)) && fs.statSync(path.join(root, cat)).isDirectory() ? fs.readdirSync(path.join(root, cat)) : []) {
  const html = path.join(root, cat, s, 'demo', 'index.html');
  if (fs.existsSync(html) && (!only.length || only.includes(s))) demos.push({ name: s, html });
}
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
  for (const d of demos) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(d.html).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.evaluate(() => typeof window.__demoPose === 'function' && window.__demoPose());
    await new Promise(r => setTimeout(r, 150));
    // viewport-only capture: a beyond-viewport capture resizes the page, which wipes canvases
    await page.screenshot({ path: path.join(path.dirname(d.html), 'preview.jpg'), type: 'jpeg', quality: 82, captureBeyondViewport: false });
    await page.close();
    console.log('preview', d.name);
  }
  // README hero: a 3 x 3 grid of the first nine previews, labelled
  const all = [];
  for (const cat of fs.readdirSync(root)) for (const s of fs.statSync(path.join(root, cat)).isDirectory() ? fs.readdirSync(path.join(root, cat)) : []) {
    const jpg = path.join(root, cat, s, 'demo', 'preview.jpg');
    if (fs.existsSync(jpg)) all.push({ name: s, src: 'data:image/jpeg;base64,' + fs.readFileSync(jpg).toString('base64') });
  }
  if (all.length) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
    await page.setContent(`<style>*{margin:0;box-sizing:border-box}body{background:#161B17;padding:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;height:900px;font:600 15px system-ui,sans-serif}
      figure{position:relative;border-radius:10px;overflow:hidden;background:#F1F4EE}img{display:block;width:100%;height:100%;object-fit:cover}
      figcaption{position:absolute;left:10px;bottom:10px;background:rgba(22,27,23,.82);color:#F1F4EE;padding:5px 10px;border-radius:999px}</style>`
      + all.slice(0, 9).map(a => `<figure><img src="${a.src}"><figcaption>${a.name}</figcaption></figure>`).join(''));
    fs.mkdirSync(path.resolve(root, '..', 'assets'), { recursive: true });
    await page.screenshot({ path: path.resolve(root, '..', 'assets', 'skills-preview.jpg'), type: 'jpeg', quality: 84, captureBeyondViewport: false });
    console.log('hero assets/skills-preview.jpg');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
