# Sounds

Original sounds made for Diloul Chess by `scripts/gen-sounds.mjs` (a physical model: damped wood
resonances plus a short contact noise). Released under **CC0 1.0** (public domain): use them freely.

| File | When |
|---|---|
| `move.wav` | a move: soft wooden knock |
| `capture.wav` | a capture: two knocks, fuller |
| `check.wav` | a check: knock plus a short high tick |
| `success.wav` | a correct move in a lesson: two rising mallet notes |
| `error.wav` | a wrong move: two low, soft notes going down |
| `promote.wav` | a promotion, and the stars at the end of a lesson |

To change a sound, edit the script and run `node scripts/gen-sounds.mjs`.
