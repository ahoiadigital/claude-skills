# gooey-section.js — engine reference

Shared by all nine `gooey-section-*` skills. Read it when you need the full API, the exact maths, the colour rules, or you are debugging an edge that doesn't show or doesn't feel right.

## Contents
1. API
2. What happens each frame
3. The nine variants, exactly
4. Drawing
5. How colours are chosen
6. Differences from the lab
7. Troubleshooting
8. Verifying it still matches the lab

## 1. API

```js
const goo = GooeyEdge.init({ variant: 'goo' });
```

| Option | Default | Meaning |
|---|---|---|
| `variant` | `'goo'` | Feel for every marked element that doesn't name its own |
| `selector` | `'[data-goo-edge]'` | Which elements get an edge on their top |
| `zIndex` | `10` | z-index of the goo canvas (the lab's value) |
| `reducedMotion` | `'flat'` | `'flat'` leaves straight edges when the visitor prefers reduced motion; `'ignore'` always animates |
| `window` | `window` | Only for tests and iframes |

Attributes on a marked element:

| Attribute | Meaning |
|---|---|
| `data-goo-edge="taffy"` | This element's top edge goos with that variant. Empty or unknown values (React renders `"true"`) fall back to the `variant` option |
| `data-goo-color="#161B17"` | Colour of the goo. Default: the element's own background |
| `data-goo-upper="#F1F4EE"` | Colour of whatever is above the edge. Default: detected |
| `data-goo-anchor="#topBtn"` | A standing bump under that element instead of scroll goo (the lab's footer) |

The controller has `seams` (each with `amp`, `target`, `ampV`, `cx`, `color`, `upper`, `el`, `c`), `setVariant(key)` (the lab's tab switch: it also zeroes `target` and the spring velocity), `refresh()` (re-reads colours and sizes after a theme or layout change) and `destroy()` (removes the canvases and stops the loop; call it on unmount). `GooeyEdge.variants` is the table below and `GooeyEdge.instances` lists live controllers for console debugging.

The file is a UMD-style plain script: a `<script>` tag defines `window.GooeyEdge`, CommonJS gets `module.exports`, and a side-effect `import './gooey-section.js'` works in Vite and webpack. It touches `window` only inside `init()`, so importing it during server rendering is safe.

## 2. What happens each frame

On every `requestAnimationFrame`:

1. `dv = scrollY − lastScrollY`, then `vel += (dv − vel) × 0.18`. So `vel` is smoothed pixels per frame.
2. For each seam:
   - While the goo is slack (`|amp| < 6px`) the crest centre eases toward the cursor's x at 0.06 per frame, so the bulge rises wherever the cursor is and does not slide around while stretched. Before the first pointer move it sits in the middle.
   - `target = clamp(vel × pull, −150, 150)`. Scrolling down gives a positive target, a bulge up into the section above. Scrolling up gives a negative one, a dip down into this section.
   - The variant's drive moves `amp` toward `target` (section 3).
3. Draw the seam if its canvas is within 200px of the viewport. Seams step even when off-screen.

All rates are per frame, not per second, exactly like the lab. On a 120Hz screen each frame sees half the scroll distance, so bulges are lower, and they relax twice as fast in wall-clock time. That is how the lab behaves on the same screen, which is what "matching" means here. Don't convert the physics to delta-time unless you are asked to.

## 3. The nine variants, exactly

`sig(a)` is the bulge width as a gaussian sigma in px, growing with the height `a`. `pull` multiplies `vel` into a target.

| Variant | Lab tab | sig(a) | pull | Drive | Profile |
|---|---|---|---|---|---|
| wave | 1 | 260 + 1.6·abs(a) | 2.2 | lerp 0.1 / 0.13 / 0.045 | gauss + 0.22·gauss(cx + 1.15σ, 0.7σ) |
| goo | 2 | 210 + 0.7·abs(a) | 2.2 | lerp 0.1 / 0.13 / 0.045 | (gauss − 0.25·gauss(2.6σ)) / 0.75 |
| taffy | 3 | 190 + 1.4·abs(a) | 1.8 | taffy up 0.13, k 0.03, damp 0.885 | gauss |
| honey | 4 | 230 + 0.9·abs(a) | 2.6 | lerp 0.06 / 0.08 / 0.018 | gauss^0.65 |
| elastic | 5 | 170 + 1.2·abs(a) | 1.6 | spring k 0.085, damp 0.8 | gauss |
| twin | 6 | 190 + 0.6·abs(a) | 2.2 | lerp 0.1 / 0.13 / 0.045 | gauss + 0.55·gauss(cx + 1.7σ, 0.62σ) |
| drift | 7 | 200 + 0.8·abs(a) | 2.2 | lerp 0.1 / 0.13 / 0.045, plus surf | gauss |
| slosh | 8 | 300 + 0.7·abs(a) | 2.4 | lerp 0.1 / 0.13 / 0.045 | −u·e^(−u²/2)·1.6487, u = (x − cx)/σ |
| peel | 9 | 185 + 0.7·abs(a) | 2.2 | peel 0.1 / 0.13 | (gauss − 0.25·gauss(2.6σ)) / 0.75 |

Drives, with `T` the eased demand:

- **lerp** (demand / up / down): `T += (target − T)·demand`, then `amp += (T − amp)·(|T| > |amp| ? up : down)`. It rises at `up` and relaxes at `down`, never overshooting.
- **spring** (k, damp): `ampV += (target − amp)·k`, `ampV ×= damp`, `amp += ampV`. It overshoots both ways.
- **taffy**: while `|target| > |amp| + 8` and they share a sign, it is pulling: `amp += (target − amp)·up` and `ampV = 0`. Otherwise it springs with k and damp. The 8px margin stops leftover scroll noise from re-grabbing the goo mid-wobble.
- **peel**: like lerp, but the release rate depends on height: `down = 0.012 + 0.09·|amp| / (|amp| + 60)`. That is about 0.076 at 150px, 0.057 at 60px, 0.035 at 20px and 0.019 at 5px.
- **Drift surf**: while `|amp| > 6`, `cx += clamp(vel·0.04, −1, 1)·0.004`, kept within 0.12–0.88 of the width.

Anchored bump (`data-goo-anchor`): the target is `92 + 70·near`, where `near = max(0, 1 − distance(cursor, anchor centre)/420)`. The crest follows the anchor's x at 0.2 per frame. It always uses the Wave width, profile and drive, whatever variant the page uses, as in the lab.

## 4. Drawing

- The canvas is 340px tall, full width, `top: −170px` inside the marked element, `pointer-events: none`, `z-index: 10`. Its middle line is the boundary. It is capped at 2× device pixel ratio.
- `amp` is clamped to ±160 for drawing and sampled at 97 points: `y = base − amp·profile(x, cx·w, sig(amp))`.
- Fill 1 is the goo colour, from 2px under the line up to the curve.
- Fill 2 is the upper colour, wherever the curve drops below the line: dips while scrolling up, the side-dips of Goo and Peel, the low side of Slosh.

## 5. How colours are chosen

- **Goo colour:** `data-goo-color`, else the element's `background-color`, else a full-size absolutely positioned child or grandchild with a background (the Lumos "Background surface" pattern), else the nearest ancestor's background, else white.
- **Upper colour:** `data-goo-upper`, else the previous in-flow sibling's colour. That means its background, or its last child's up to four levels down (for wrapper divs), or failing that the colour behind it. If the element is its parent's first child, the engine uses the parent's colour when the parent pads above it, otherwise it keeps climbing.
- Only `background-color` is detected. Over gradients, images or video, set both attributes by hand. After a runtime theme switch, call `goo.refresh()`.

## 6. Differences from the lab

None of these change the motion. The parity test in section 8 proves the heights and curves are identical.

- Setup is by attribute, instead of hand-placed canvases with a two-colour map.
- The goo fill stops 2px under the line. The lab paints the section's own colour over the top 170px of every section, which hides any content there.
- Edges are flat under reduced motion. The lab has no reduced-motion handling.
- It reads the device pixel ratio on every resize, re-measures on layout changes with a `ResizeObserver`, and has `destroy()`.
- Cursor x is measured from the element's left edge. That is identical for full-width sections.
- The lab's Goo entry carries an unused `alive: true` flag, which is dropped.

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No goo at all | Script ran before the markup, or the element isn't marked | Load it after the sections (footer / before `</body>`); the engine also waits for DOMContentLoaded |
| Goo is cut flat at the boundary | The marked section, or a wrapper right around it, has `overflow: hidden` or `clip` (the engine warns in the console) | Set `overflow: visible` on it |
| Goo appears under the section above | The upper section has a higher z-index or its own stacking context above | Lower or remove it, or raise `zIndex` |
| Goo draws over the fixed nav | The nav's z-index is below 10 | Raise the nav, or pass a lower `zIndex` |
| Wrong colour in the bulge or the dips | Background comes from an image, gradient or an unusual wrapper | Set `data-goo-color` / `data-goo-upper` |
| Works in the browser, not in the Webflow Designer | Custom code never runs on the Designer canvas or in its Preview | Check the published or staging site |
| Bulges are tiny | A 120Hz screen, or a smooth-scroll library that eases the scroll | Expected; the lab behaves the same. Only retune if asked |
| Nothing moves with a custom scroll container | The engine reads `window.scrollY` | Make the window scroll (Lenis-style libraries do) |

## 8. Verifying it still matches the lab

In Louis's private labs repo, next to the original lab, two tests guard the port:

- `node tests/gooey-section-parity.cjs` runs the lab's own script and this engine side by side in a fake DOM. It feeds both the same 640 frames of scroll and pointer input for each variant and requires every height and every curve point to be identical. It also checks that each skill ships a byte-identical copy of the engine.
- `node tests/gooey-section-browser.cjs` compares each skill's demo page with the lab in Chrome, pixel column by column at 2×.

In any project, a copied engine matches when its checksum equals the skill's copy:

```bash
shasum path/to/your/gooey-section.js ~/.claude/skills/gooey-section-goo/assets/gooey-section.js
```
