# claude-skills

Skills for [Claude Code](https://claude.com/claude-code). Each folder in `skills/` is one skill: a `SKILL.md` that tells Claude when and how to use it, plus any files it needs.

Most of these rebuild effects from Louis's motion labs, exactly. Instead of describing an animation and hoping, the skill ships the lab's own engine, so a fresh Claude session reproduces the tuned feel on any page.

## Skills

### Gooey section edges

The boundary between two page sections behaves like a liquid surface pulled by scroll speed. One skill per feel:

| Skill | Feel |
|---|---|
| `gooey-section-wave` | A broad, flowing crest with a soft shoulder trailing to its right |
| `gooey-section-goo` | A tight, sticky pull whose flanks sink slightly (the default) |
| `gooey-section-taffy` | Stretches while you scroll; let go and it drops, overshoots and wobbles once |
| `gooey-section-honey` | A heavy, full blob, slow to rise, droops back very slowly |
| `gooey-section-elastic` | Twangy: overshoots the pull and springs back past flat |
| `gooey-section-twin` | The main pull with a smaller blob rising beside it |
| `gooey-section-drift` | The crest surfs sideways along the edge in the scroll direction |
| `gooey-section-slosh` | A liquid lean: rises on one side of the cursor, dips on the other |
| `gooey-section-peel` | Drains fast from full stretch, then the last of it peels off slowly |

Each one covers plain HTML, Webflow (custom attribute plus footer code) and React or Next.js. Open `skills/gooey-section-<feel>/assets/demo.html` in a browser to see a feel before using it.

## Install

```bash
git clone https://github.com/ahoiadigital/claude-skills.git
cd claude-skills
python3 install.py
```

This links every skill into `~/.claude/skills/`, so Claude Code sees them in every project. Because they are links, `git pull` updates them in place. Rerun `install.py` after adding a skill.

To install a single skill instead:

```bash
ln -s "$PWD/skills/gooey-section-taffy" ~/.claude/skills/
```

## Using them

Ask in your own words, for example "add the taffy goo between these sections", and Claude picks the matching skill. You can also call one directly with `/gooey-section-taffy`.

## Adding a skill

1. Create `skills/<name>/SKILL.md`. Its frontmatter `name` must match the folder name, and its `description` should say what the skill does and when to use it, because that is what Claude reads to decide.
2. Put any files the skill needs beside it, in `assets/`, `references/` or `scripts/`.
3. If several skills are generated from shared sources, keep the sources in `sources/<family>/` with a build script, and edit those rather than the generated folders. `sources/gooey-section/build.py` is the example.
4. Run `python3 install.py`.
