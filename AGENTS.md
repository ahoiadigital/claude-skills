# claude-skills — repo guide

Louis's agent skills, published at https://github.com/loouis/claude-skills. **This repo is public.** Skills live in category folders, each skill with `SKILL.md`, `REFERENCES.md`, `agents/openai.yaml` and, for visual skills, a `demo/`.

## What to do here
- Add new skills under `skills/<category>/`.
- Improve existing skills: `SKILL.md` first, then `REFERENCES.md`, then the demo.
- Keep skills procedural: steps, defaults, guardrails, checks.

## Working conventions
- Read `STATUS.md` before starting and update it after substantive work.
- Commit after every completed change, one skill per commit (`Add <skill-name> skill` / `Update <skill-name> skill`). Pushing publishes to the public repo, so push when Louis asks for it or confirms.
- Commits here use GitHub's no-reply address for `loouis`, set automatically by `~/.gitconfig` for any `github.com/loouis/...` remote, so Louis's email stays out of the public history. Don't add a per-repo `user.email`.

## Folder contract
See README.md → "Repo structure". In short: `skills/<category>/<skill-name>/` with `SKILL.md` (frontmatter `name` = folder name, a `description` that says what and when), `agents/openai.yaml` (`display_name`, `short_description`, `default_prompt` invoking `$<skill-name>`), `REFERENCES.md` (links only), and optional `assets/`, `references/`, `scripts/`, `demo/` (`index.html`, `PROMPT.md`, `preview.jpg` at 1280×720). Every category has a `README.md`; its skills table and the root README's library list are generated between `<!-- skills:… -->` / `<!-- library:… -->` markers.

## Commands
- `python3 install.py` — link every skill into `~/.claude/skills/` (`--dry-run` to preview).
- `node scripts/build-previews.cjs [skill-name…]` — render `demo/preview.jpg` and `assets/skills-preview.jpg` (needs puppeteer; `NODE_PATH` may point at an existing install).
- `node scripts/build-gallery.cjs` — regenerate DEMOS.md, SCREENSHOTS.md/.html and the generated README lists.
- `node scripts/validate-skills.cjs` — check every skill against the contract. Run before committing.

## Public hygiene (check before every commit)
- No client or project names, no private file paths, no emails, keys or tokens, nothing from private repos beyond what a skill needs. The validator flags private paths.

## gooey-section family
- Generated: edit `sources/gooey-section/` (engine, `engine.md`, `demo.html`, `PROMPT.md`, `REFERENCES.md`, per-variant text in `build.py`), then `python3 sources/gooey-section/build.py`. Never hand-edit `skills/sections/gooey-section-*`.
- The engine must stay a 1:1 port of the original lab. The lab and the tests that prove the match live in Louis's private labs repo (a sibling checkout, `../labs`): after changing the engine or rebuilding, run `node tests/gooey-section-parity.cjs` and `node tests/gooey-section-browser.cjs` there.
