#!/usr/bin/env python3
"""Generate the nine gooey-section-* skills into <repo>/skills.

    python3 sources/gooey-section/build.py

Edit gooey-section.js, engine.md, demo.html (all beside this file) or the V text
below, then rerun. Never edit the generated skills/gooey-section-* folders by hand:
they are overwritten. Run `python3 install.py` from the repo root to link new skills.
"""
import os, shutil, sys
from pathlib import Path

SRC = Path(__file__).resolve().parent
OUT = SRC.parent.parent / 'skills'

V = [
  dict(key='wave', label='Wave', tab=1,
    oneliner='a broad, flowing crest with a soft shoulder trailing to its right',
    triggers="the wave goo, the wave edge, the wave section divider, 'the wave one' or Louis's favourite goo",
    feel="The calm, wide one, and Louis's favourite of the set. The bulge is a wide gaussian that gets fatter as it rises, plus a low shoulder (22% of the height) trailing to the right of the crest, so the edge reads as a rolling wave rather than a blob. It rises in about half a second under steady scrolling and relaxes smoothly with no overshoot. Its shape is also the one the anchored bump uses on every variant.",
    width='σ 260px at rest, +1.6px per px of height (up to ~520px)',
    pull='2.2 × scroll speed, capped at 150px',
    rise='height eases at 0.13/frame behind a 0.1/frame demand',
    release='relaxes at 0.045/frame, never passes below flat',
    flick='peaks ~82px, flat again ~1.7s later (60fps)',
    check='a wide, smooth swell with a small shoulder on its right, sinking back without ever passing below the line.',
    tuning=['Width: `sig` base 260 and widening 1.6.', 'Shoulder: 0.22 (height) and 1.15σ (offset) in the profile.', 'Strength: `vel` 2.2.', 'Speed: `drive.up` 0.13 (rise) and `drive.down` 0.045 (relax).'],
    other='taffy'),
  dict(key='goo', label='Goo', tab=2,
    oneliner='a tight, sticky pull whose flanks sink slightly before rejoining the flat line',
    triggers="the goo edge, 'the goo one' or the sticky goo",
    default=True,
    feel="The lab's default, and the one Louis was nailing. The bulge is a difference of gaussians: a narrow rise about ±1.8σ wide, flanked by long shallow dips (down to about 16% of the height, around 3σ out) painted in the upper section's colour, like surface tension feeding the blob. It stays fairly narrow as it grows. It rises in about half a second and relaxes smoothly with no overshoot, and the curve has no creases anywhere.",
    width='σ 210px at rest, +0.7px per px of height',
    pull='2.2 × scroll speed, capped at 150px',
    rise='height eases at 0.13/frame behind a 0.1/frame demand',
    release='relaxes at 0.045/frame, no overshoot',
    flick='peaks ~82px, flat again ~1.7s later (60fps)',
    check='a tight bulge with the edge pulled slightly down on both sides of it, sinking back without overshooting.',
    tuning=['Width: `sig` 210 + 0.7.', 'Side-dip depth: the 0.25 in the profile (0 removes the dips).', 'Side-dip reach: the 2.6σ in the profile.', 'Strength: `vel` 2.2. Speed: `drive.up` 0.13 and `drive.down` 0.045.'],
    other='elastic'),
  dict(key='taffy', label='Taffy', tab=3,
    oneliner='it stretches smoothly while you scroll; let go and it drops, overshoots past flat, comes back and gives one small wobble',
    triggers="the taffy goo or taffy edge, or wants a scroll-driven section edge that stretches and then snaps back with a single wobble",
    feel="Viscous while it's being pulled, springy only on the let-go. While the scroll keeps pulling, the height eases toward the target like the calm variants. The moment the pull weakens, a spring takes over: it drops fast (half height in about 11 frames), swings below the line into a small dip (about a fifth of the peak, painted in the upper colour), comes back and settles after one more small wobble. The spring period is about 40 frames (0.67s at 60fps) and each swing is about 30% of the last. It's a little narrower than Goo and pulled a little less.",
    width='σ 190px at rest, +1.4px per px of height',
    pull='1.8 × scroll speed, capped at 150px',
    rise='height eases at 0.13/frame while pulling',
    release='spring k 0.03, damping 0.885 from the moment of release; an 8px margin stops scroll noise re-grabbing it mid-wobble',
    flick='peaks ~77px, dips to about −16px, flat again ~0.9s after release',
    check='on release it falls fast, dips just below the line with the upper colour showing, rises back and wobbles once more, small, before settling.',
    tuning=['Wobble speed: `drive.k` 0.03 (higher is faster).', 'Wobble decay: `drive.damp` 0.885 (lower means fewer wobbles).', 'Pull: `drive.up` 0.13 and `vel` 1.8.', 'Width: `sig` 190 + 1.4.'],
    other='honey'),
  dict(key='honey', label='Honey', tab=4,
    oneliner='a heavy, full blob that is slow to rise and droops back very slowly',
    triggers="the honey goo or honey edge, or wants a heavy, slow, syrupy or droopy section edge",
    feel="Weight and lag. It's pulled harder than any other variant (2.6× scroll speed) but follows sluggishly: the demand eases at 0.06/frame and the height at 0.08/frame, so it keeps swelling for a moment after the scroll stops. The release is the slowest of the set at 0.018/frame, a long droop of three to four seconds. The profile is a gaussian raised to the power 0.65, which is simply a fuller bump, about 24% wider, with a rounder top.",
    width='σ 230px at rest (about 285px effective after the 0.65 power), +0.9px per px of height',
    pull='2.6 × scroll speed, capped at 150px',
    rise='demand 0.06/frame, height 0.08/frame, so it lags the scroll',
    release='0.018/frame, no overshoot',
    flick='peaks ~73px about 7 frames after the scroll stops, flat again ~3.8s later',
    check='the blob keeps rising briefly after you stop, then sinks very slowly, still full and round.',
    tuning=['Heaviness: `drive.down` 0.018 (release) and `drive.up` 0.08 (rise).', 'Lag: `drive.demand` 0.06.', 'Fullness: the 0.65 exponent (lower gives a flatter, broader top).', 'Strength: `vel` 2.6.'],
    other='goo'),
  dict(key='elastic', label='Elastic', tab=5,
    oneliner='twangy: it overshoots whatever the scroll asks for and springs back past flat before settling',
    triggers="the elastic goo or elastic edge, or wants a bouncy, springy, twangy or rubber-band section edge",
    feel="A pure spring throughout, while pulling and on release, so it overshoots the target even while you're still scrolling and twangs back. The spring period is about 25 frames (0.4s at 60fps) and each swing is about a quarter of the last. A short flick gives the clearest bounce: the bulge shoots up well past where the calm variants stop, then snaps back and dips a little past flat. It's the narrowest variant and pulled the least (1.6×), and it settles fastest of all.",
    width='σ 170px at rest, +1.2px per px of height (the narrowest)',
    pull='1.6 × scroll speed, capped at 150px',
    rise='spring k 0.085, damping 0.8, overshoots the target',
    release='the same spring, about a 25-frame period',
    flick='a short flick peaks ~39px where Goo reaches 23px; a long one peaks ~78px within 16 frames and settles ~0.5s after release',
    check='the bulge springs up past the pull and wobbles while you scroll, then snaps back and dips a little past the line on release.',
    tuning=['Stiffness: `drive.k` 0.085 (higher is faster and twangier).', 'Bounciness: `drive.damp` 0.8 (higher means more bounces).', 'Width: `sig` 170 + 1.2. Strength: `vel` 1.6.'],
    other='wave'),
  dict(key='twin', label='Twin', tab=6,
    oneliner='the main pull with a smaller sympathetic blob rising beside it',
    triggers="the twin goo or twin edge, or wants a section edge with two blobs or a double bulge",
    feel="Two bumps instead of one. Alongside the main crest, a second blob 55% as tall and a bit narrower (0.62×) rises about 1.7σ to its right (about 320px at rest, further as it grows), with a saddle between them. The motion is the calm lerp: it rises in about half a second and relaxes smoothly with no overshoot. The main crest is fairly narrow and widens only slowly.",
    width='σ 190px at rest, +0.6px per px of height; the second blob is 0.62σ',
    pull='2.2 × scroll speed, capped at 150px',
    rise='height eases at 0.13/frame behind a 0.1/frame demand',
    release='relaxes at 0.045/frame, no overshoot',
    flick='peaks ~82px, flat again ~1.7s later (60fps)',
    check='a main bulge under the cursor with a smaller one to its right, both rising and sinking together.',
    tuning=['Second blob height: 0.55.', 'Second blob position: 1.7σ to the right (a negative value puts it on the left).', 'Second blob width: 0.62σ.', 'Main width: `sig` 190 + 0.6.'],
    other='drift'),
  dict(key='drift', label='Drift', tab=7,
    oneliner='the crest surfs sideways along the edge in the direction you scroll',
    triggers="the drift goo or drift edge, or wants a section edge whose bulge travels or surfs sideways as you scroll",
    feel="A single gaussian crest that travels. While the goo is stretched (more than 6px), its centre slides right when you scroll down and left when you scroll up, by up to 0.4% of the width per frame. That is full speed from about 25px of scroll per frame, roughly a quarter of the width per second at 60fps, and it never leaves the 12%–88% band of the width. Once the edge is slack again, the crest eases back to wait under the cursor. The height motion is the calm lerp, with no overshoot.",
    width='σ 200px at rest, +0.8px per px of height',
    pull='2.2 × scroll speed, capped at 150px',
    rise='height eases at 0.13/frame behind a 0.1/frame demand',
    release='relaxes at 0.045/frame, no overshoot',
    flick='peaks ~82px while travelling right, flat again ~1.7s later',
    check='the bulge moves along the edge as you keep scrolling (right when scrolling down, left when scrolling up), then returns to the cursor once flat.',
    tuning=['Surf speed: the 0.004 step.', 'Speed sensitivity: the 0.04 factor on velocity.', 'Travel limits: 0.12–0.88 of the width.', 'Width: `sig` 200 + 0.8.', 'The surf constants live in `step()`, not the variant table, so they apply to every drift edge.'],
    other='slosh'),
  dict(key='slosh', label='Slosh', tab=8,
    oneliner='a liquid lean: the edge rises on one side of the cursor and dips on the other, like water tilting',
    triggers="the slosh goo or slosh edge, or wants a section edge that tilts, leans or sloshes like liquid",
    feel="Instead of a bump, the edge tilts. The profile is the negative derivative of a gaussian: scrolling down lifts the edge to the left of the cursor (peak about 1σ left, about 300px at rest) and sinks it to the right, where the dip is painted in the upper section's colour, with the crossing right under the cursor. Scrolling up tilts it the other way. It's the widest variant and pulled a bit harder (2.4×). The motion is the calm lerp, with no overshoot.",
    width='σ 300px at rest, +0.7px per px of height (the widest)',
    pull='2.4 × scroll speed, capped at 150px',
    rise='height eases at 0.13/frame behind a 0.1/frame demand',
    release='relaxes at 0.045/frame, no overshoot',
    flick='rises ~89px on one side and dips as deep on the other, flat again ~1.7s later',
    check="scrolling down, the edge climbs on the cursor's left and sinks on its right; scrolling up reverses it.",
    tuning=['Width of the lean: `sig` 300 + 0.7.', 'Strength: `vel` 2.4.', 'Direction: negate the profile to lean the other way.', 'The 1.6487 factor normalises the peak to 1. Leave it.'],
    other='peel'),
  dict(key='peel', label='Peel', tab=9,
    oneliner='it drains fast from full stretch, then the last of it peels off slowly',
    triggers="the peel goo or peel edge, or wants a section edge that lets go fast then lingers with a slow tail",
    feel="Goo's shape (a tight bulge with shallow side-dips) with a height-dependent release. The release rate falls as the goo drains, `0.012 + 0.09·a/(a + 60)` per frame: about 0.08 at 150px, 0.057 at 60px, 0.035 at 20px and 0.02 at 5px. A big stretch drops quickly at first, then the last few pixels linger and peel away slowly. Nothing overshoots. Compared with Goo it lets go faster at the top and takes about 50% longer to reach flat.",
    width='σ 185px at rest, +0.7px per px of height',
    pull='2.2 × scroll speed, capped at 150px',
    rise='height eases at 0.13/frame behind a 0.1/frame demand',
    release='0.012 + 0.09·a/(a + 60) per frame: fast when tall, slow when nearly flat',
    flick='peaks ~82px, halves in ~26 frames, flat again ~2.6s later',
    check='a quick first drop, then a thin sliver that lingers along the edge before finally flattening.',
    tuning=['Tail speed: 0.012, the floor of the release rate.', 'Early drop: 0.09.', 'Where the pace changes: 60 (px).', 'These live in the peel branch of `step()`, so they apply to every peel edge.'],
    other='wave'),
]

VEL = dict(wave=2.2, goo=2.2, taffy=1.8, honey=2.6, elastic=1.6, twin=2.2, drift=2.2, slosh=2.4, peel=2.2)

def description(v):
    d = (f"Rebuilds the '{v['label']}' gooey section edge from Louis's motion labs "
         f"(gooey-sections.html, tab {v['tab']}): {v['oneliner']}. The boundary between two page sections "
         f"acts like a liquid surface driven by scroll speed. Use this skill whenever the user asks for "
         f"{v['triggers']}, or for gooey sections tab {v['tab']}, on a plain HTML page, a Webflow site "
         f"or a React/Next.js app, even if they only name the feel. ")
    if v.get('default'):
        d += ("This is the default feel: also use it when someone asks for a gooey, goo, liquid, blobby or melting "
              "section edge, divider or transition without naming a variant. ")
    d += "It ships a verified 1:1 port of the lab engine, so the result matches the lab exactly."
    assert len(d) <= 1024, (v['key'], len(d))
    return d

TEMPLATE = '''---
name: gooey-section-{key}
description: {description}
---

# Gooey section edge: {label}

{label} is tab {tab} of Louis's gooey sections lab (`gooey-sections.html`): {oneliner}. The boundary between two page sections behaves like a liquid surface pulled by scroll speed. This skill rebuilds exactly that feel on any page.

## What it should feel like

{feel}

| {label} | |
|---|---|
| Bulge width | {width} |
| Pull | {pull} |
| Rise | {rise} |
| Release | {release} |
| Hard flick (45px per frame for half a second) | {flick} |

All nine variants share the rest. Scrolling down drags the lower section's colour up into the section above. Scrolling back up dips the edge down, filled with the upper section's colour. When the edge is slack, the crest waits under the cursor. At rest the edge is a straight line.

The original lives in Louis's private labs repo (`gooey-sections.html`, tab {tab}), served at http://localhost:8094 on Louis's Mac. If you can open it, compare side by side.

## Build it

The feel lives in about twenty hand-tuned constants and in physics that runs per animation frame. `assets/gooey-section.js` is a 1:1 port of the lab's engine, verified identical frame by frame (see `references/engine.md` section 8). Use that file rather than writing your own version. A rewrite in GSAP, CSS, SVG or delta-time physics drifts from what Louis tuned, even when it looks close.

1. Copy `assets/gooey-section.js` into the project unchanged. It is one plain script with no dependencies.
2. Add `data-goo-edge` to every section whose **top** edge should goo. The edge belongs to the section below the boundary, because that section's colour is what gets pulled up. The first section on the page has nothing above it, so leave it unmarked.
3. Load the script after the markup, then start it:

   ```html
   <script src="/js/gooey-section.js"></script>
   <script>GooeyEdge.init({{ variant: '{key}' }});</script>
   ```

`assets/demo.html` is a complete working page with this variant, including the optional anchored bump. Open it to see the target, or copy from it.

To mix feels on one page, give a section its own value, for example `data-goo-edge="{other}"`.

### Webflow

- On each section, open Element settings and add a custom attribute named `data-goo-edge` with the value `{key}`. On a Lumos site, that's the `section_<name>` element.
- Webflow can't host .js files as assets, so paste the engine inline. In Site settings or Page settings, go to Custom code, Footer (Before `</body>` tag). Add `<script>`, the full contents of `assets/gooey-section.js`, then `</script>`, followed by `<script>GooeyEdge.init({{ variant: '{key}' }});</script>`. The engine is about 17,000 characters and the field holds 50,000, so it fits alongside other code.
- Custom code never runs on the Designer canvas or in its Preview, so check the goo on the published or staging (webflow.io) site.
- Backgrounds from `u-theme-*` classes or a Background surface component are detected automatically. If the bulge shows the wrong colour, add `data-goo-color` and `data-goo-upper` attributes with the hex values.

### React / Next.js

Copy the engine into the source tree next to a tiny client component that starts it after the sections exist and cleans up on unmount:

```jsx
// GooeyEdges.jsx
'use client';
import {{ useEffect }} from 'react';
import './gooey-section.js'; // defines window.GooeyEdge in the browser; safe during SSR

export default function GooeyEdges({{ variant = '{key}' }}) {{
  useEffect(() => {{
    const goo = window.GooeyEdge.init({{ variant }});
    return () => goo.destroy();
  }}, [variant]);
  return null;
}}
```

Render `<GooeyEdges variant="{key}" />` once, after the sections, in the page that renders them. Keeping the effect in this leaf means an app-router page can stay a Server Component. Mark the sections with `data-goo-edge="{key}"` (or `""`); a bare `data-goo-edge` renders as `"true"`, which also falls back to the component's variant. React Strict Mode's double effect is fine, because `destroy()` removes everything. On client-side route changes the component unmounts and remounts with the new page, so each page gets fresh edges.

## Make sure the page lets it show

The goo canvas is 340px tall and hangs 170px above the marked section's top edge, painting over the bottom of the section above. Four things can spoil it:

- **Clipping.** If the marked section, or a wrapper right around it, has `overflow: hidden` or `clip`, the bulge is cut flat at the boundary. The engine warns about this in the console. Set it to `overflow: visible`.
- **Stacking.** The canvas sits at z-index 10 inside the marked section. If the section above has a higher z-index, the bulge slides underneath it. A fixed nav below z-index 10 gets painted over.
- **Colours.** Detection reads `background-color` only. Over gradients, images or video, set `data-goo-color` (this section) and `data-goo-upper` (the one above).
- **Dips cover content.** Scrolling up dips the edge up to 160px into the marked section. Keep about 170px of space above the section's content, as the lab does, so text isn't briefly covered. On Lumos sites the top Spacer does this.

Visitors who prefer reduced motion get straight edges.

## Check it

- Scroll hard, then stop: {check}
- Scroll back up: the edge dips down, filled with the colour of the section above.
- Keep the page still, move the cursor, then scroll: the bulge rises under the cursor.
- With a browser you can drive, pose a frame to inspect it: run `GooeyEdge.instances[0].seams[0].amp = 120`, then screenshot. The loop relaxes it from there.
- The copied engine must be byte-identical to `assets/gooey-section.js`. Compare them with `shasum`.

## Tuning, only when asked

Leave the numbers alone unless the user asks for a different feel, because they match the lab. If asked, these are the knobs for {label}. The full table is in `references/engine.md`.

{tuning}

Tune by adding a variant rather than editing one in place, so the original stays available to compare against:

```js
GooeyEdge.variants['{key}-soft'] = {{ ...GooeyEdge.variants.{key}, vel: {softvel} }}; // was {vel}
GooeyEdge.init({{ variant: '{key}-soft' }});
```

Copy `drive` too (`drive: {{ ...GooeyEdge.variants.{key}.drive, … }}`) before changing its numbers, so the original isn't mutated.
'''

def build():
    engine = (SRC / 'gooey-section.js').read_bytes()
    ref = (SRC / 'engine.md').read_text()
    demo = (SRC / 'demo.html').read_text()
    names = []
    for v in V:
        name = f"gooey-section-{v['key']}"
        d = OUT / name
        if d.exists():
            shutil.rmtree(d)
        (d / 'assets').mkdir(parents=True)
        (d / 'references').mkdir()
        body = TEMPLATE.format(description=description(v), tuning='\n'.join('- ' + t for t in v['tuning']),
                               vel=VEL[v['key']], softvel=round(VEL[v['key']] * 0.75, 2),
                               **{k: v[k] for k in ('key', 'label', 'tab', 'oneliner', 'feel', 'width', 'pull',
                                                    'rise', 'release', 'flick', 'check', 'other')})
        (d / 'SKILL.md').write_text(body)
        (d / 'assets' / 'gooey-section.js').write_bytes(engine)
        (d / 'assets' / 'demo.html').write_text(
            demo.replace('{{KEY}}', v['key']).replace('{{LABEL}}', v['label'])
                .replace('{{TAB}}', str(v['tab'])).replace('{{ONELINER}}', v['oneliner'][0].upper() + v['oneliner'][1:] + '.'))
        (d / 'references' / 'engine.md').write_text(ref)
        names.append(name)
    return names

if __name__ == '__main__':
    names = build()
    print('built', len(names), 'skills:', ', '.join(names))
