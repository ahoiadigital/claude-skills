#!/usr/bin/env python3
"""Link every skill in skills/ into ~/.claude/skills so Claude Code picks it up.

    python3 install.py           # link all skills (safe to rerun)
    python3 install.py --dry-run # show what would change

It links rather than copies, so a skill edited here is live in every session.
An existing entry is only replaced when it is a symlink that is broken or already
points into this repo. A real folder, or a link to somewhere else, is left alone
and reported, so nothing you installed another way gets overwritten.
"""
import os, re, sys
from pathlib import Path

REPO = Path(__file__).resolve().parent
SKILLS = REPO / 'skills'
TARGET = Path.home() / '.claude' / 'skills'
dry = '--dry-run' in sys.argv

def skill_name(d):
    text = (d / 'SKILL.md').read_text()
    m = re.search(r'^name:\s*(\S+)\s*$', text.split('---')[1] if text.startswith('---') else '', re.M)
    return m.group(1) if m else None

problems = 0
TARGET.mkdir(parents=True, exist_ok=True)
for d in sorted(p for p in SKILLS.iterdir() if (p / 'SKILL.md').is_file()):
    name = skill_name(d)
    if name != d.name:
        print(f'skip   {d.name}: SKILL.md name is {name!r}, it must match the folder name'); problems += 1; continue
    link = TARGET / d.name
    if link.is_symlink():
        dest = Path(os.path.realpath(link))
        if dest == d.resolve():
            print(f'ok     {d.name}'); continue
        broken = not link.exists()
        if broken or REPO in dest.parents:
            if not dry: link.unlink(); link.symlink_to(d)
            print(f'relink {d.name}' + (' (was broken)' if broken else '')); continue
        print(f'leave  {d.name}: already linked to {dest}'); problems += 1; continue
    if link.exists():
        print(f'leave  {d.name}: a real folder is already installed at {link}'); problems += 1; continue
    if not dry: link.symlink_to(d)
    print(f'link   {d.name}')
sys.exit(1 if problems else 0)
