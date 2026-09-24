# Twin Gooey Section Demo Prompts

## Minimal prompt

Use $gooey-section-twin to add the twin gooey edge between the sections of this page.

## Recreate the demo

Use $gooey-section-twin to build a standalone reference demo for this feel:

> The main pull with a smaller sympathetic blob rising beside it.

### Direction

Make the edge itself the demonstration: tall, calm sections in two flat colours, so the only thing moving is the boundary. Scrolling down should drag the lower colour up into the section above; scrolling back up should dip the edge the other way.

### Canonical example

- Six full-height sections alternating cream #F1F4EE and dark #161B17, starting with a cream hero titled "Twin".
- Every section after the hero gets `data-goo-edge` on its top edge.
- The fifth section has a "Top of page" button; the footer's edge is a standing bump anchored under it with `data-goo-anchor`.

### Deliverable

- Create demo/index.html as a standalone document with inline CSS.
- Load the skill's engine unchanged from ../assets/gooey-section.js and start it with `GooeyEdge.init({ variant: 'twin' })`.
- No framework, package manager, build step or node_modules.
