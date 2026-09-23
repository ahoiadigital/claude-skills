/*!
 * gooey-section.js v1.0.0 — velocity-driven goo on section edges.
 *
 * A 1:1 port of the Seam engine in Louis's motion labs (gooey-sections.html).
 * Every constant here was tuned by eye in that lab, and the physics runs per
 * animation frame (not per second) exactly like the lab. Change nothing unless
 * you mean to change the feel.
 *
 * Usage: mark each section whose TOP edge should goo with data-goo-edge (the edge
 * belongs to the section below the boundary), load this file after the markup, then
 * call GooeyEdge.init({ variant: '<name>' }). It is safe to paste inline in a script
 * tag (this file never contains a closing script tag).
 *
 * Variants: wave · goo · taffy · honey · elastic · twin · drift · slosh · peel
 * Optional attributes on a marked section:
 *   data-goo-color="#161B17"   colour of the goo (default: the section's background)
 *   data-goo-upper="#F1F4EE"   colour of the section above (default: detected)
 *   data-goo-anchor="#topBtn"  standing bump under that element instead of scroll goo
 */
(function (factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.GooeyEdge = api;
})(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * The nine feels. Each one is: how wide the bulge is (sig, grows with
   * height), how hard scroll velocity pulls it (vel), how the height
   * follows the pull (drive), and the shape of the edge (profile).
   * ------------------------------------------------------------------ */
  const gauss = (x, cx, sig) => Math.exp(-((x - cx) ** 2) / (2 * sig * sig));
  // difference of gaussians: narrow rise, wide shallow side-dips, no creases
  const dog = (x, cx, sig) => (gauss(x, cx, sig) - 0.25 * gauss(x, cx, sig * 2.6)) / 0.75;
  const lerpDrive = () => ({ type: 'lerp', demand: 0.1, up: 0.13, down: 0.045 });

  const VARIANTS = {
    wave: { label: 'Wave', tab: 1,           // broad flowing crest
      sig: a => 260 + Math.abs(a) * 1.6, vel: 2.2, drive: lerpDrive(),
      profile: (x, cx, sig) => gauss(x, cx, sig) + gauss(x, cx + sig * 1.15, sig * 0.7) * 0.22 },
    goo: { label: 'Goo', tab: 2,             // localized sticky pull
      sig: a => 210 + Math.abs(a) * 0.7, vel: 2.2, drive: lerpDrive(), profile: dog },
    taffy: { label: 'Taffy', tab: 3,         // smooth pull; release drops, overshoots, one wobble
      sig: a => 190 + Math.abs(a) * 1.4, vel: 1.8,
      drive: { type: 'taffy', up: 0.13, k: 0.03, damp: 0.885 }, profile: gauss },
    honey: { label: 'Honey', tab: 4,         // heavy blob, slow droopy release
      sig: a => 230 + Math.abs(a) * 0.9, vel: 2.6,
      drive: { type: 'lerp', demand: 0.06, up: 0.08, down: 0.018 },
      profile: (x, cx, sig) => Math.pow(gauss(x, cx, sig), 0.65) },
    elastic: { label: 'Elastic', tab: 5,     // twangy, bounces once or twice
      sig: a => 170 + Math.abs(a) * 1.2, vel: 1.6,
      drive: { type: 'spring', k: 0.085, damp: 0.8 }, profile: gauss },
    twin: { label: 'Twin', tab: 6,           // main pull with a smaller sympathetic blob beside it
      sig: a => 190 + Math.abs(a) * 0.6, vel: 2.2, drive: lerpDrive(),
      profile: (x, cx, sig) => gauss(x, cx, sig) + 0.55 * gauss(x, cx + sig * 1.7, sig * 0.62) },
    drift: { label: 'Drift', tab: 7,         // the crest surfs along the edge in the scroll direction
      sig: a => 200 + Math.abs(a) * 0.8, vel: 2.2, drift: true, drive: lerpDrive(), profile: gauss },
    slosh: { label: 'Slosh', tab: 8,         // liquid lean: rises one side of the pull, dips the other
      sig: a => 300 + Math.abs(a) * 0.7, vel: 2.4, drive: lerpDrive(),
      profile: (x, cx, sig) => { const u = (x - cx) / sig; return -u * Math.exp(-u * u / 2) * 1.6487; } },
    peel: { label: 'Peel', tab: 9,           // drains fast at full stretch, the tail peels off slowly
      sig: a => 185 + Math.abs(a) * 0.7, vel: 2.2,
      drive: { type: 'peel', demand: 0.1, up: 0.13 }, profile: dog },
  };

  const HALF = 170;                // the canvas reaches 170px above and below the boundary
  const STEPS = 96;                // curve samples across the width
  const MAX_TARGET = 150;          // px — cap on how far velocity can pull
  const MAX_AMP = 160;             // px — cap on the drawn height
  const SLACK = 6;                 // below this height the crest may follow the cursor
  const VEL_SMOOTH = 0.18;         // per-frame smoothing of scroll velocity
  const ANCHOR = { rest: 92, swell: 70, reach: 420, follow: 0.2 };

  /* ------------------------------ colours ------------------------------ */
  function alphaOf(c) {
    if (!c || c === 'transparent') return 0;
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return 1;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    return parts.length >= 4 ? parseFloat(parts[3]) : 1;
  }
  // the flat colour an element paints: its background, or a full-size
  // absolutely positioned layer inside it (Lumos "Background surface" pattern)
  function ownFill(el, win) {
    const cs = win.getComputedStyle(el);
    if (alphaOf(cs.backgroundColor) > 0) return cs.backgroundColor;
    if (!el.querySelectorAll) return null;
    const r = el.getBoundingClientRect();
    for (const k of el.querySelectorAll(':scope > *, :scope > * > *')) {
      const s = win.getComputedStyle(k);
      if ((s.position === 'absolute' || s.position === 'fixed') && alphaOf(s.backgroundColor) > 0) {
        const kr = k.getBoundingClientRect();
        if (kr.width >= r.width * 0.9 && kr.height >= r.height * 0.9) return s.backgroundColor;
      }
    }
    return null;
  }
  function colourBehind(el, win) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = ownFill(n, win); if (c) return c; }
    return '#ffffff';
  }
  function inFlow(el, win) {
    const s = win.getComputedStyle(el);
    return s.display !== 'none' && s.position !== 'absolute' && s.position !== 'fixed' && el.offsetHeight > 0;
  }
  function bottomColour(el, win, depth) {
    const c = ownFill(el, win);
    if (c) return c;
    if ((depth || 0) < 4) {
      let k = el.lastElementChild;
      while (k && !inFlow(k, win)) k = k.previousElementSibling;
      if (k) return bottomColour(k, win, (depth || 0) + 1);
    }
    return null;
  }
  // the colour sitting directly above an element's top edge
  function colourAbove(section, win) {
    let n = section;
    while (n.parentElement) {
      let p = n.previousElementSibling;
      while (p && !inFlow(p, win)) p = p.previousElementSibling;
      if (p) return bottomColour(p, win) || colourBehind(n.parentElement, win);
      const parent = n.parentElement;
      if (n.getBoundingClientRect().top - parent.getBoundingClientRect().top > 1) return colourBehind(parent, win);
      n = parent;
    }
    return colourBehind(n, win);
  }

  /* ------------------------------- a seam ------------------------------ */
  class Seam {
    constructor(section, variant, anchor, opts, env) {
      const win = env.win, doc = section.ownerDocument;
      this.el = section; this.variant = variant; this.anchor = anchor; this.env = env;
      const c = doc.createElement('canvas');
      c.className = 'goo-seam';
      c.setAttribute('aria-hidden', 'true');
      Object.assign(c.style, {
        position: 'absolute', left: '0', top: -HALF + 'px', width: '100%', height: 2 * HALF + 'px',
        pointerEvents: 'none', zIndex: String(opts.zIndex), display: 'block',
      });
      const cs = win.getComputedStyle(section);
      if (cs.position === 'static') { section.style.position = 'relative'; this.madeRelative = true; }
      if (/hidden|clip/.test(cs.overflowY || cs.overflow || '') && win.console) {
        win.console.warn('GooeyEdge: this section clips its overflow, so the goo above its top edge is cut off. Give it overflow: visible.', section);
      }
      section.prepend(c);
      this.c = c;
      this.ctx = c.getContext('2d');
      this.amp = 0; this.target = 0; this.ampV = 0;   // bulge height (px, + = up into the section above)
      this.cx = 0.5;                                   // crest centre as a fraction of the width
      this.ys = new Float64Array(STEPS + 1);
      this.readColours();
      this.resize();
    }
    readColours() {
      const win = this.env.win, el = this.el;
      this.color = el.getAttribute('data-goo-color') || ownFill(el, win) || colourBehind(el.parentElement, win);
      this.upper = el.getAttribute('data-goo-upper') || colourAbove(el, win);
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      const dpr = Math.min(this.env.win.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height;
      this.c.width = this.w * dpr; this.c.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    inView() {
      const r = this.c.getBoundingClientRect();
      this.left = r.left;
      return r.bottom > -200 && r.top < this.env.win.innerHeight + 200;
    }
    step() {
      const { pointer } = this.env, vel = this.env.vel, w = this.w;
      if (!(w > 0)) return;
      const left = this.left || 0;
      // the crest anchors loosely under the cursor (only drifts while the goo is slack)
      const targetCx = pointer.y > 0 ? (pointer.x - left) / w : 0.5;
      if (Math.abs(this.amp) < SLACK) this.cx += (targetCx - this.cx) * 0.06;
      // Drift: while stretched, the crest surfs along in the scroll direction
      if (this.variant.drift && !this.anchor && Math.abs(this.amp) > SLACK) {
        this.cx += Math.max(-1, Math.min(1, vel * 0.04)) * 0.004;
        this.cx = Math.max(0.12, Math.min(0.88, this.cx));
      }

      let target;
      if (this.anchor) {
        // standing bump under the anchor element, swells as the pointer approaches
        const b = this.anchor.getBoundingClientRect();
        const ax = b.left + b.width / 2, ay = b.top + b.height / 2;
        this.cx += ((ax - left) / w - this.cx) * ANCHOR.follow;
        const near = pointer.y > 0 ? Math.max(0, 1 - Math.hypot(pointer.x - ax, pointer.y - ay) / ANCHOR.reach) : 0;
        target = ANCHOR.rest + ANCHOR.swell * near;
      } else {
        // scroll speed drags the edge out: up when scrolling down, dipping when scrolling back up
        target = Math.max(-MAX_TARGET, Math.min(MAX_TARGET, vel * this.variant.vel));
      }

      const drive = this.anchor ? VARIANTS.wave.drive : this.variant.drive;
      if (drive.type === 'spring') {
        this.ampV += (target - this.amp) * drive.k;
        this.ampV *= drive.damp;
        this.amp += this.ampV;
      } else if (drive.type === 'peel') {
        // release rate falls as the goo drains, so the tail peels off slowly
        this.target += (target - this.target) * drive.demand;
        const stretching = Math.abs(this.target) > Math.abs(this.amp);
        const a = Math.abs(this.amp);
        const down = 0.012 + 0.09 * a / (a + 60);
        this.amp += (this.target - this.amp) * (stretching ? drive.up : down);
      } else if (drive.type === 'taffy') {
        // viscous while being pulled, springy only on the let-go; the +8 margin stops
        // residual scroll noise from re-grabbing the goo mid-wobble
        const pulling = Math.abs(target) > Math.abs(this.amp) + 8 && target * this.amp >= 0;
        if (pulling) {
          this.amp += (target - this.amp) * drive.up;
          this.ampV = 0;               // the spring starts fresh at the moment of release
        } else {
          this.ampV += (target - this.amp) * drive.k;
          this.ampV *= drive.damp;
          this.amp += this.ampV;
        }
      } else {
        this.target += (target - this.target) * drive.demand;
        const stretching = Math.abs(this.target) > Math.abs(this.amp);
        this.amp += (this.target - this.amp) * (stretching ? drive.up : drive.down);
      }
    }
    draw() {
      const { ctx, w, h, ys } = this;
      ctx.clearRect(0, 0, w, h);
      const base = h / 2;                               // the section boundary
      const amp = Math.max(-MAX_AMP, Math.min(MAX_AMP, this.amp));
      const cx = this.cx * w;
      const v = this.anchor ? VARIANTS.wave : this.variant;
      const sig = v.sig(amp);
      for (let i = 0; i <= STEPS; i++) ys[i] = base - amp * v.profile((i / STEPS) * w, cx, sig);
      // the goo: this section's colour rising above the boundary. (The lab fills to the
      // canvas bottom; stopping 2px under the boundary looks identical on a solid
      // section and leaves the section's own content visible.)
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(-2, base + 2);
      ctx.lineTo(-2, base);
      for (let i = 0; i <= STEPS; i++) ctx.lineTo((i / STEPS) * w, ys[i]);
      ctx.lineTo(w + 2, base);
      ctx.lineTo(w + 2, base + 2);
      ctx.closePath();
      ctx.fill();
      // wherever the curve dips BELOW the boundary (scrolling back up), paint the
      // upper section's colour into the dip, otherwise the reverse goo is invisible
      ctx.fillStyle = this.upper;
      ctx.beginPath();
      ctx.moveTo(-2, base);
      for (let i = 0; i <= STEPS; i++) ctx.lineTo((i / STEPS) * w, Math.max(base, ys[i]));
      ctx.lineTo(w + 2, base);
      ctx.closePath();
      ctx.fill();
    }
    destroy() {
      this.c.remove();
      if (this.madeRelative) this.el.style.position = '';
    }
  }

  /* ------------------------------ instance ----------------------------- */
  const instances = [];

  function init(opts) {
    opts = Object.assign({ variant: 'goo', selector: '[data-goo-edge]', zIndex: 10, reducedMotion: 'flat' }, opts || {});
    if (!VARIANTS[opts.variant]) throw new Error('GooeyEdge: unknown variant "' + opts.variant + '". Use one of: ' + Object.keys(VARIANTS).join(', '));
    const win = opts.window || window, doc = win.document;
    const env = { win, vel: 0, lastY: 0, pointer: { x: win.innerWidth / 2, y: -1 } };
    const ctl = { seams: [], variant: opts.variant, setVariant, refresh, destroy };
    let raf = 0, ro = null, dead = false;

    function onPointer(e) { env.pointer.x = e.clientX; env.pointer.y = e.clientY; }
    function onResize() { for (const s of ctl.seams) s.resize(); }
    function frame() {
      const y = win.scrollY, dv = y - env.lastY;
      env.lastY = y;
      env.vel += (dv - env.vel) * VEL_SMOOTH;           // smoothed px per frame
      for (const s of ctl.seams) { const vis = s.inView(); s.step(); if (vis) s.draw(); }
      raf = win.requestAnimationFrame(frame);
    }
    function start() {
      if (dead) return;
      const reduced = opts.reducedMotion === 'flat' && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) return;                                // plain straight edges, no canvas
      for (const el of doc.querySelectorAll(opts.selector)) {
        const key = (el.getAttribute('data-goo-edge') || '').trim().toLowerCase();
        const variant = VARIANTS[key] || VARIANTS[opts.variant];
        const sel = el.getAttribute('data-goo-anchor');
        const anchor = sel ? doc.querySelector(sel) : null;
        ctl.seams.push(new Seam(el, variant, anchor, opts, env));
      }
      env.lastY = win.scrollY;
      win.addEventListener('pointermove', onPointer, { passive: true });
      win.addEventListener('resize', onResize);
      if (typeof win.ResizeObserver === 'function') {
        ro = new win.ResizeObserver(onResize);
        for (const s of ctl.seams) ro.observe(s.el);
      }
      raf = win.requestAnimationFrame(frame);
    }
    function setVariant(key) {
      if (!VARIANTS[key]) throw new Error('GooeyEdge: unknown variant "' + key + '"');
      ctl.variant = key;
      for (const s of ctl.seams) { if (!s.anchor) s.variant = VARIANTS[key]; s.target = 0; s.ampV = 0; }
    }
    function refresh() { for (const s of ctl.seams) { s.readColours(); s.resize(); } }
    function destroy() {
      dead = true;
      if (raf) win.cancelAnimationFrame(raf);
      win.removeEventListener('pointermove', onPointer);
      win.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
      for (const s of ctl.seams) s.destroy();
      ctl.seams.length = 0;
      const i = instances.indexOf(ctl);
      if (i >= 0) instances.splice(i, 1);
    }

    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
    instances.push(ctl);
    return ctl;
  }

  return { version: '1.0.0', variants: VARIANTS, init, instances };
});
