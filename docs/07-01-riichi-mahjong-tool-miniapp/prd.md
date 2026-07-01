# 立直麻将工具小程序功能规划

## Goal

Build a WeChat mini-program for riichi mahjong scoring, practice, and rule lookup, using the reference screenshots in `docs/功能参考图/` as the feature evidence source.

The product should help users:

- calculate four-player and three-player riichi mahjong scores from hands and table conditions;
- practice common offline scoring skills such as waits, fu, final points, and comeback thresholds;
- look up yaku, fu rules, and han/fu point tables quickly;
- record or revisit mahjong point information only where screenshot evidence supports it.

## Evidence Source

The complete screenshot evidence analysis is saved at:

- `.trellis/tasks/07-01-riichi-mahjong-tool-miniapp/screenshot-analysis.md`

The frontend reference analysis is saved at:

- `.trellis/tasks/07-01-riichi-mahjong-tool-miniapp/frontend-reference-analysis.md`

All 17 screenshots under `docs/功能参考图/` were read. Advertising content, visual styling, layout details, and unproven commercial modules are explicitly out of scope.
Frontend structure and interaction states should reference `docs/pencil-html/` and `docs/pencil-exports-local/`, but those design references do not add product scope by themselves.

## Confirmed Facts

- The repository is a `weapp-vite` native WeChat mini-program template using `src` as `weapp.srcRoot`.
- Existing app routes are minimal template pages: `pages/index/index` and `pages/layouts/index`.
- There is no `.codegraph/` directory, so CodeGraph is not available for this repository.
- The screenshot set confirms the following feature families:
  - home feature navigation;
  - quick scoring with four-player and three-player calculation buttons;
  - hand, meld, dora indicator, ura-dora indicator, seat wind, round wind, honba, extra yaku, and three-player north-dora inputs;
  - chinitu wait practice;
  - fu calculation practice and fu help;
  - point calculation practice and point help;
  - comeback han/fu practice;
  - interactive han/fu point calculator;
  - han/fu point quick lookup table;
  - yaku list and yaku detail pages;
  - entry-only evidence for chat-style scoring, old-yaku scoring, table-score records, screenshot sharing, and contact/feedback.
- The user confirmed the recommended MVP split: implement quick scoring, lookup/yaku support, and core practice modules first; keep chat-style scoring, old-yaku scoring, table-score records, and physical hand recognition as placeholders or later-scope modules unless separately expanded.
- The frontend design should use `docs/pencil-html/` and `docs/pencil-exports-local/` as references for page hierarchy, component patterns, interaction states, and copy direction.
- The user confirmed quick scoring MVP should support red dora. This is a product decision beyond the original screenshot evidence; point practice still follows the screenshot rule that generated questions have no red dora.
- The user confirmed quick scoring MVP should not support riichi-stick deposits / kyoutaku. Riichi and double-riichi remain yaku conditions, but deposit-stick settlement is out of scope.
- The user confirmed the remaining recommended defaults:
  - no practice ad gate in MVP;
  - sanma quick scoring supports north-dora count, no chi, and common Japanese sanma tsumo-loss settlement with a clear rule warning;
  - scoring covers modern standard riichi yaku and common yakuman, excluding local yaku and old yaku from the main scoring engine;
  - old-yaku scoring, chat-style scoring, table-score records, and physical hand recognition stay placeholder/later-scope;
  - lightweight share-result/share-page actions are allowed where WeChat supports them;
  - practice feedback should show correctness, standard answer, user answer, and a short breakdown when available.

## Requirements

### R1. Home Feature Navigation

- Provide a home entry surface for all confirmed major modules:
  - quick scoring;
  - chat-style scoring, marked as a later or placeholder module until behavior is confirmed;
  - chinitu wait practice;
  - han/fu point calculation;
  - fu calculation practice;
  - old-yaku scoring, marked as a later or placeholder module until behavior is confirmed;
  - point calculation practice;
  - yaku help;
  - comeback han/fu practice;
  - table-score record, marked as a later or placeholder module until behavior is confirmed;
  - han/fu point quick lookup;
  - contact/feedback.
- Do not add payment, membership, subscription, mall, coupon, points, or order modules without separate evidence.

### R2. Quick Scoring

- Support a quick scoring form with:
  - bottom-sheet tile keyboard for hand input, where the last selected tile is treated as the winning tile;
  - bottom-sheet tile keyboard flow for meld input;
  - bottom-sheet tile keyboard flow for dora indicator input;
  - bottom-sheet tile keyboard flow for ura-dora indicator input;
  - red-five tile selection for quick scoring hand and meld input;
  - north-dora count from 0 to 4;
  - round wind and seat wind selection;
  - extra condition selection for double riichi, riichi, ippatsu, rinshan, tsumo, haitei/houtei, chankan, tenhou, and chiihou;
  - honba count;
  - rule option for double-wind pair as 2 fu;
  - four-player calculation and three-player calculation actions;
  - reset action.
- If the hand cannot be scored as a winning hand, route to hand-efficiency calculation rather than silently failing.
- MVP must not require or expose text hand input. Text grammar can be reconsidered later as an advanced/debug input only.
- Tile input should follow the Pencil reference direction: a bottom popup with tile preview, suit tabs, tile grid, max-count warnings, delete, clear, and done actions.
- Red dora should count as dora han in quick scoring while still obeying physical tile count limits for five tiles.
- Riichi-stick deposits / kyoutaku should not be included in quick scoring MVP.

### R3. Scoring Results

- The result view should, at minimum, be able to display:
  - whether the hand is valid;
  - yaku list;
  - han count;
  - fu count when applicable;
  - limit class when applicable, such as mangan, haneman, baiman, sanbaiman, or yakuman;
  - ron payment;
  - tsumo split payments for dealer/non-dealer cases;
  - four-player or three-player mode;
  - any warnings or unscorable conditions.
- The screenshot set does not show the real result page, so exact result layout and secondary fields remain open.

### R4. Hand Efficiency Fallback

- When quick scoring input is not a complete winning hand, support a hand-efficiency result.
- MVP hand-efficiency output must include:
  - shanten number;
  - effective tile list;
  - total effective tile count.
- MVP should not expose separate normal-hand, chiitoitsu, and kokushi shanten branches as user-facing detail. Those can remain internal or be added later.

### R5. Practice Modules

- Chinitu wait practice:
  - show a chinitu hand;
  - allow selecting wait answers from suited tile candidates;
  - confirm the answer;
  - track current correct streak.
- Fu calculation practice:
  - show a generated hand and conditions such as round wind, seat wind, and win method;
  - allow selecting fu answers from 20 through 170 fu options;
  - provide fu help;
  - follow screenshot-confirmed generation rules: generated hands include haitei/houtei to avoid no-yaku hands; kokushi musou and chiitoitsu are fixed at 25 fu and excluded from the fu practice set; ambiguous decomposition picks higher points, then higher han, then higher fu.
- Point calculation practice:
  - show a generated hand and conditions;
  - let users input total acquired points;
  - instruct users to enter 0 for no-yaku hands;
  - provide point calculation help;
  - allow showing/hiding an embedded han/fu point lookup table;
  - follow screenshot-confirmed generation rules: default four-player mode, no red dora in questions, no invisible yaku such as riichi unless visible/declared, chiitoitsu is 25 fu, answers do not include honba.
- Comeback han/fu practice:
  - generate a comeback scenario with user seat wind, target player seat wind, required point gap, and ron condition;
  - ask for the minimum fu or “impossible” for each shown han tier;
  - provide access to han/fu point calculation support.
- Practice feedback must eventually include answer correctness; screenshots do not confirm answer explanation, next-question behavior, accuracy, wrong-answer history, or redo-wrong-question support.

### R6. Rule And Lookup Content

- Fu help must cover:
  - what fu means;
  - chiitoitsu and kokushi musou fixed-fu handling as used by the tool;
  - base fu, menzen ron, tsumo fu, wait fu, meld/tile-group fu, pair fu, double-wind pair handling, rounding, jump-fu explanation, and examples.
- Point help must cover:
  - hand analysis;
  - yaku analysis;
  - dora counting;
  - fu calculation;
  - point calculation;
  - base-point formula;
  - mangan, haneman, baiman, sanbaiman, and yakuman;
  - dealer/non-dealer ron and tsumo payments.
- Han/fu point calculator must allow selecting han and fu and show dealer/non-dealer ron and tsumo point results.
- Han/fu quick lookup must allow browsing point rows by han, with visible rows for 1 through 13 han and fu options including 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, and 110 where legal.
- Yaku help must include a yaku list and detail pages with at least yaku name, han value, condition, and example.

### R7. Entry-Only Modules

- Chat-style scoring, old-yaku scoring, and table-score records are confirmed as home entries only.
- They should stay as placeholders in MVP until their input/output and user flow are specified.
- If the home page needs to expose these entries before full implementation, use a clear non-destructive placeholder state rather than inventing behavior.

### R8. Sharing And Feedback

- Support screenshot sharing only where product scope keeps it; screenshot evidence shows a “forward screenshot” action on at least quick scoring and comeback practice pages.
- Include lightweight share-result / share-page behavior where WeChat supports it.
- Provide a contact/feedback entry from home.
- Do not infer social feeds, comments, accounts, or customer-support systems from the screenshots.

### R9. Advertising And Usage Limits

- Advertising content is not part of the product scope.
- The screenshots show a possible practice-use condition: wrong answers may require watching an ad, with a daily threshold after enough ad views.
- MVP should not implement any practice ad gate or ad-view unlock. Practice is unrestricted.

### R10. Frontend Reference Direction

- Use Pencil exports as the frontend reference for:
  - home grouping by scoring, practice, reference, and records/recognition;
  - quick scoring page structure and result states;
  - tile input keyboard interactions;
  - chat-style stepper placeholder or later implementation direction;
  - yaku list/detail page structure;
  - han/fu calculator and quick lookup table structure;
  - practice answer feedback panels;
  - help pages with compact tables and examples;
  - safe “功能建设中” placeholder page for deferred modules.
- Treat `docs/pencil-exports-local/` PNGs as design-state references, not as new feature evidence.
- Treat `docs/pencil-html/` as a useful implementation reference for page naming and text hierarchy, not as copy-paste-ready mini-program code.
- Do not implement physical hand recognition in MVP unless the user explicitly expands scope; the Pencil export can be kept as a future reference.

### R11. Confirmed MVP Defaults

- Three-player quick scoring:
  - support north-dora count;
  - disallow chi;
  - show a clear sanma rule warning;
  - use common Japanese sanma tsumo-loss settlement unless a future task changes the rule variant.
- Yaku coverage:
  - implement modern standard riichi yaku and common yakuman required for normal scoring;
  - exclude local yaku and old yaku from the main scoring engine.
- Practice feedback:
  - show correctness;
  - show the standard answer;
  - show the user's answer;
  - show a short breakdown when available;
  - defer wrong-answer history and redo-wrong-question workflows.

## Out Of Scope

- Visual style, layout, colors, typography, icons, cards, animation, or any UI fidelity work based on screenshots.
- Payment, membership, subscription, e-commerce, coupons, distribution, orders, refunds, or points-mall modules.
- Advertising placement, advertising materials, advertising brand copy, or ad network integration unless separately requested.
- Wrong-answer book, favorites, account system, language switching, and copy-result behavior unless future evidence or product decisions add them.
- Physical hand recognition in MVP.
- Practice ad gates and ad-view unlocks.
- Local-yaku / old-yaku scoring in the main scoring engine.

## Acceptance Criteria

- [ ] The task preserves the screenshot evidence in `screenshot-analysis.md`, including all 17 image records and certainty labels.
- [ ] The implemented home entry set matches screenshot-confirmed modules and does not add unproven commercial modules.
- [ ] Quick scoring supports the screenshot-confirmed inputs and actions, including four-player/three-player calculation and hand-efficiency fallback.
- [ ] Hand-efficiency fallback shows shanten number, effective tile list, and total effective tile count.
- [ ] Quick scoring uses a bottom-sheet tile keyboard for hand, meld, dora, and ura-dora entry, and rejects invalid tile selections with user-facing errors.
- [ ] Quick scoring supports red-five input and includes red dora in dora han counting.
- [ ] Scoring results distinguish yaku, han, fu, limit class, ron payment, and tsumo split payments where applicable.
- [ ] Practice modules include chinitu wait practice, fu calculation practice, point calculation practice, and comeback han/fu practice with the screenshot-confirmed inputs and constraints.
- [ ] Practice feedback shows correctness, standard answer, user answer, and a short breakdown when available.
- [ ] Rule lookup includes fu help, point help, han/fu calculator, han/fu quick lookup, yaku list, and yaku detail.
- [ ] Entry-only modules are either explicitly scoped and implemented or safely represented as not-yet-available placeholders.
- [ ] Frontend page structure, interaction states, and placeholders reference `docs/pencil-html/` and `docs/pencil-exports-local/` where relevant.
- [ ] Advertising content is ignored and no practice ad gate is implemented.
- [ ] Validation covers core scoring math, fu calculation, yaku recognition, point table outputs, and practice answer checking.

## Confirmed Product Defaults

The user approved all recommended defaults:

1. Practice ad gate: no ad gate in MVP; practice is unrestricted and all ad copy/content is ignored.
2. Three-player rules: support sanma quick scoring with north-dora count, no chi, and a clear rule warning; default to common Japanese sanma tsumo-loss settlement unless the user specifies another variant.
3. Yaku coverage: implement modern standard riichi yaku and common yakuman needed for normal scoring; exclude local yaku and old yaku from the main scoring engine.
4. Old-yaku scoring: keep as placeholder in MVP; use Pencil export only as future design reference.
5. Chat-style scoring: keep as placeholder in MVP; use Pencil export only as future design reference.
6. Table-score records: keep as placeholder in MVP; use Pencil export only as future design reference.
7. Physical hand recognition: keep out of MVP; optional placeholder or hidden entry only.
8. Sharing: include a lightweight share-result / share-page action where WeChat supports it, but do not build a social feed or account system.
9. Practice feedback: show correctness, standard answer, user's answer, and a short breakdown when available; defer wrong-answer history and redo-wrong-question workflows.
