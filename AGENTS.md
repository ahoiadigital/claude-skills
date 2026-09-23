# claude-skills

Louis's Claude Code skills, published at https://github.com/ahoiadigital/claude-skills. **This repo is public.**

## Working conventions

- Read `STATUS.md` before starting and update it after substantive work.
- Commit after every completed change, one logical change per commit. Pushing publishes to the public repo, so push when Louis asks for it or confirms.
- Public hygiene, before every commit: no client or project names, no private file paths, no emails, keys or tokens, and nothing copied from private repos except what a skill needs. `grep -rn "/Users/" skills sources` should come back empty.
- This repo commits with GitHub's no-reply address (set in the repo's local git config), so Louis's email stays out of the public history.

## Structure

- `skills/<name>/` — one skill per folder: `SKILL.md` (frontmatter `name` = folder name, plus a `description` saying what and when) and any `assets/`, `references/`, `scripts/`. Keep `SKILL.md` under about 500 lines and move detail into `references/`.
- `sources/<family>/` — shared sources and a `build.py` for skills generated as a family. Never hand-edit generated folders; edit the sources and rebuild.
- `install.py` — links every skill into `~/.claude/skills/` (`--dry-run` to preview). It only replaces links that are broken or already point into this repo.

## gooey-section family

- Rebuild: `python3 sources/gooey-section/build.py`. Test prompts for skill evaluation: `sources/gooey-section/evals.json`.
- The engine `sources/gooey-section/gooey-section.js` must stay a 1:1 port of the original lab. The lab and the tests that prove the match live in Louis's private labs repo (a sibling checkout, `../labs`). After changing the engine or rebuilding, run from there: `node tests/gooey-section-parity.cjs` and `node tests/gooey-section-browser.cjs`.
