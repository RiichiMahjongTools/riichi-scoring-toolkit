# Frontend Reference Analysis

## Reference Sources

- `docs/pencil-html/`
  - `pages-01-06.html`
  - `pages-07-12.html`
  - `pages-13-18.html`
  - `ZZ4uV.html`
- `docs/pencil-exports-local/`
  - 18 PNG exports inspected.

These references are for frontend structure, interaction states, component patterns, and page copy direction. They do not override the feature evidence in `screenshot-analysis.md`; when a Pencil screen contains a feature that was only an entry in the original screenshots, it should still be treated according to the PRD scope decision.

## Page Reference Map

| Export | Interpreted page / state | Design or interaction reference |
| --- | --- | --- |
| `BSp1N.png` | Home page with contact feedback bottom sheet | Grouped feature entries, contact/feedback modal, entry-only modules visible on home |
| `cR1so.png` | Point calculation practice feedback state | Digit answer input, no-yaku warning, embedded han/fu mini table, correct-answer feedback |
| `duolQ.png` | Chat-style scoring flow | Stepper flow, recognized hand summary, current step card, skip/reset/previous actions, confirmation summary |
| `FkKfI.png` | Tile input keyboard | Tile preview, max tile count warning, suit tabs, tile grid, delete/clear/done actions |
| `H4poj.png` | Yaku list | Yaku grouping, category filters, yaku tags, list item metadata |
| `jsjyg.png` | Feature under construction placeholder | Safe placeholder state for deferred modules |
| `LxAHC.png` | Table-score record page | Four-player table state, honba/kyoutaku, one-hand record form, validation notice, history, undo/clear confirmation |
| `QgEaN.png` | Old-yaku score calculator | Old-yaku chips, custom old-yaku name, estimation conditions, point output, sanma warning |
| `qrZsc.png` | Yaku detail | Header metadata, alias, tags, example hand, detailed explanation, supplemental notes, not-found warning |
| `t45pL5.png` | Chinitu wait practice feedback | Multi-select wait answer grid and submitted feedback |
| `vasOb.png` | Han/fu point calculator | Han/fu selectors and four payment result cards |
| `w54lRI.png` | Fu help | Compact rule tables and example explanation |
| `wLBUN.png` | Physical hand recognition | Camera/photo actions, preview, recognition result, warnings/errors, manual correction, copy final hand |
| `Wys3n.png` | Han/fu quick lookup table | Han tabs, four-player payment table, impossible-combination notice, hide table action |
| `xgJxr.png` | Quick scoring result/input page | Mode/win/honba summary, hand/meld entry actions, rules, warnings, final score, efficiency fallback, clear/edit/share actions |
| `XsUJ6.png` | Point help | Scoring step summary, payment formulas, fixed limit table, example |
| `Zu6uF.png` | Comeback han/fu practice feedback | Target point gap, per-han answer comparison, streak notice, jump to calculator |
| `ZZ4uV.png` | Fu calculation practice feedback | Fu answer options, wrong-answer feedback, fu breakdown table, help action |

## Frontend Constraints To Carry Forward

- Keep the app as a real tool surface, not a marketing landing page.
- Use the Pencil references for information hierarchy and state coverage:
  - home grouping by scoring, practice, reference, and records/recognition;
  - page-level top navigation with help/share affordances where useful;
  - compact cards for individual data groups and feedback panels;
  - clear warning/error/success states;
  - visible intermediate states for deferred modules.
- Prefer concrete mahjong interactions over freeform text where Pencil provides a control:
  - tile keyboard for hand input;
  - chips/toggles for winds, win method, yaku conditions, han/fu options;
  - tables for point lookup and rule explanation;
  - feedback panels with standard answer vs user answer.
- Keep front-end styling inspired by Pencil exports, but do not treat the exports as pixel-perfect implementation requirements unless the user explicitly asks for fidelity.

## Scope Notes

- The Pencil exports include fuller concepts for chat-style scoring, old-yaku scoring, table-score records, and physical hand recognition.
- The original function screenshots only confirmed some of these as home entries or did not show them at all.
- Current planning should therefore:
  - include quick scoring, lookup, yaku, and practice pages in MVP;
  - keep old-yaku, table records, chat-style scoring, and physical recognition behind placeholder or later-scope decisions unless the user explicitly expands MVP.
