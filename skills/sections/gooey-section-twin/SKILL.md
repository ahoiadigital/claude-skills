---
name: gooey-section-twin
description: Rebuilds the 'Twin' gooey section edge from Louis's motion labs (gooey-sections.html, tab 6): the main pull with a smaller sympathetic blob rising beside it. The boundary between two page sections acts like a liquid surface driven by scroll speed. Use this skill whenever the user asks for the twin goo or twin edge, or wants a section edge with two blobs or a double bulge, or for gooey sections tab 6, on a plain HTML page, a Webflow site or a React/Next.js app, even if they only name the feel. It ships a verified 1:1 port of the lab engine, so the result matches the lab exactly.
---

# Gooey section edge: Twin

Twin is tab 6 of Louis's gooey sections lab (`gooey-sections.html`): the main pull with a smaller sympathetic blob rising beside it. The boundary between two page sections behaves like a liquid surface pulled by scroll speed. This skill rebuilds exactly that feel on any page.

## What it should feel like

Two bumps instead of one. Alongside the main crest, a second blob 55% as tall and a bit narrower (0.62×) rises about 1.7σ to its right (about 320px at rest, further as it grows), with a saddle between them. The motion is the calm lerp: it rises in about half a second and relaxes smoothly with no overshoot. The main crest is fairly narrow and widens only slowly.

| Twin | |
|---|---|
| Bulge width | σ 190px at rest, +0.6px per px of height; the second blob is 0.62σ |
| Pull | 2.2 × scroll speed, capped at 150px |
| Rise | height eases at 0.13/frame behind a 0.1/frame demand |
| Release | relaxes at 0.045/frame, no overshoot |
| Hard flick (45px per frame for half a second) | peaks ~82px, flat again ~1.7s later (60fps) |

All nine variants share the rest. Scrolling down drags the lower section's colour up into the section above. Scrolling back up dips the edge down, filled with the upper section's colour. When the edge is slack, the crest waits under the cursor. At rest the edge is a straight line.

The original lives in Louis's private labs repo (`gooey-sections.html`, tab 6), served at http://localhost:8094 on Louis's Mac. If you can open it, compare side by side.

## Build it

The feel lives in about twenty hand-tuned constants and in physics that runs per animation frame. `assets/gooey-section.js` is a 1:1 port of the lab's engine, verified identical frame by frame (see `references/engine.md` section 8). Use that file rather than writing your own version. A rewrite in GSAP, CSS, SVG or delta-time physics drifts from what Louis tuned, even when it looks close.

1. Copy `assets/gooey-section.js` into the project unchanged. It is one plain script with no dependencies.
2. Add `data-goo-edge` to every section whose **top** edge should goo. The edge belongs to the section below the boundary, because that section's colour is what gets pulled up. The first section on the page has nothing above it, so leave it unmarked.
3. Load the script after the markup, then start it:

   ```html
   <script src="/js/gooey-section.js"></script>
   <script>GooeyEdge.init({ variant: 'twin' });</script>
   ```

`demo/index.html` is a complete working page with this variant, including the optional anchored bump, and `demo/preview.jpg` shows a frame of it. Open the page to see the target, or copy from it; it loads the engine from `../assets/`.

To mix feels on one page, give a section its own value, for example `data-goo-edge="drift"`.

### Webflow

- On each section, open Element settings and add a custom attribute named `data-goo-edge` with the value `twin`. On a Lumos site, that's the `section_<name>` element.
- Webflow can't host .js files as assets, so paste the engine inline. In Site settings or Page settings, go to Custom code, Footer (Before `</body>` tag). Add `<script>`, the full contents of `assets/gooey-section.js`, then `</script>`, followed by `<script>GooeyEdge.init({ variant: 'twin' });</script>`. The engine is about 17,000 characters and the field holds 50,000, so it fits alongside other code.
- Custom code never runs on the Designer canvas or in its Preview, so check the goo on the published or staging (webflow.io) site.
- Backgrounds from `u-theme-*` classes or a Background surface component are detected automatically. If the bulge shows the wrong colour, add `data-goo-color` and `data-goo-upper` attributes with the hex values.

### React / Next.js

Copy the engine into the source tree next to a tiny client component that starts it after the sections exist and cleans up on unmount:

```jsx
// GooeyEdges.jsx
'use client';
import { useEffect } from 'react';
import './gooey-section.js'; // defines window.GooeyEdge in the browser; safe during SSR

export default function GooeyEdges({ variant = 'twin' }) {
  useEffect(() => {
    const goo = window.GooeyEdge.init({ variant });
    return () => goo.destroy();
  }, [variant]);
  return null;
}
```

Render `<GooeyEdges variant="twin" />` once, after the sections, in the page that renders them. Keeping the effect in this leaf means an app-router page can stay a Server Component. Mark the sections with `data-goo-edge="twin"` (or `""`); a bare `data-goo-edge` renders as `"true"`, which also falls back to the component's variant. React Strict Mode's double effect is fine, because `destroy()` removes everything. On client-side route changes the component unmounts and remounts with the new page, so each page gets fresh edges.

## Make sure the page lets it show

The goo canvas is 340px tall and hangs 170px above the marked section's top edge, painting over the bottom of the section above. Four things can spoil it:

- **Clipping.** If the marked section, or a wrapper right around it, has `overflow: hidden` or `clip`, the bulge is cut flat at the boundary. The engine warns about this in the console. Set it to `overflow: visible`.
- **Stacking.** The canvas sits at z-index 10 inside the marked section. If the section above has a higher z-index, the bulge slides underneath it. A fixed nav below z-index 10 gets painted over.
- **Colours.** Detection reads `background-color` only. Over gradients, images or video, set `data-goo-color` (this section) and `data-goo-upper` (the one above).
- **Dips cover content.** Scrolling up dips the edge up to 160px into the marked section. Keep about 170px of space above the section's content, as the lab does, so text isn't briefly covered. On Lumos sites the top Spacer does this.

Visitors who prefer reduced motion get straight edges.

## Check it

- Scroll hard, then stop: a main bulge under the cursor with a smaller one to its right, both rising and sinking together.
- Scroll back up: the edge dips down, filled with the colour of the section above.
- Keep the page still, move the cursor, then scroll: the bulge rises under the cursor.
- With a browser you can drive, pose a frame to inspect it: run `GooeyEdge.instances[0].seams[0].amp = 120`, then screenshot. The loop relaxes it from there.
- The copied engine must be byte-identical to `assets/gooey-section.js`. Compare them with `shasum`.

## Tuning, only when asked

Leave the numbers alone unless the user asks for a different feel, because they match the lab. If asked, these are the knobs for Twin. The full table is in `references/engine.md`.

- Second blob height: 0.55.
- Second blob position: 1.7σ to the right (a negative value puts it on the left).
- Second blob width: 0.62σ.
- Main width: `sig` 190 + 0.6.

Tune by adding a variant rather than editing one in place, so the original stays available to compare against:

```js
GooeyEdge.variants['twin-soft'] = { ...GooeyEdge.variants.twin, vel: 1.65 }; // was 2.2
GooeyEdge.init({ variant: 'twin-soft' });
```

Copy `drive` too (`drive: { ...GooeyEdge.variants.twin.drive, … }`) before changing its numbers, so the original isn't mutated.

Read [REFERENCES.md](REFERENCES.md) for the platform docs, and `references/engine.md` for the full API, the exact maths and troubleshooting.
