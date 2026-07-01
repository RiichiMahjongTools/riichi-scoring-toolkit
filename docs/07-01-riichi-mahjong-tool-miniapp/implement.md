# Implementation Plan

## Current Implementation Status

- Implemented the first playable MVP across home, quick scoring, han/fu lookup, yaku/help references, four practice modes, contact, share, and deferred-module placeholders.
- Quick scoring uses a bottom-sheet tile keyboard for hand, dora, and ura-dora entry; hand text input was not added.
- Red fives are selectable for hand entry and counted as red dora.
- Kyoutaku / riichi-stick deposit settlement was intentionally excluded.
- Chat-style scoring, old-yaku scoring, table-score records, physical hand recognition, meld structure entry, ad gates, and payment/membership modules remain out of MVP.
- Validation passed: `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm stylelint`.
- Runtime acceptance passed in WeChat DevTools with base library `3.15.2`; direct Page-domain reads and taps work after downgrading from `3.16.2`.
- Screenshot acceptance artifacts were written under `.tmp/acceptance-sdk3152-direct/`; `wv screenshot` worked for a single home capture, while multi-page captures used the same DevTools automator endpoint directly because `wv screenshot --page` was flaky in this DevTools session.

## Phase 0. Planning Review

- [x] Review `screenshot-analysis.md` and confirm the feature evidence.
- [x] Review `frontend-reference-analysis.md`, `docs/pencil-html/`, and `docs/pencil-exports-local/` before frontend implementation.
- [x] Use the confirmed MVP boundary:
  - quick scoring core, han/fu lookup, yaku help, and core practice modes first;
  - defer chat-style scoring, old-yaku scoring, table-score records, and physical hand recognition unless the user expands scope.
- [x] Exclude practice wrong-answer ad gating and ad-view unlocks from MVP.
- [x] Use a bottom-sheet tile keyboard for quick scoring tile entry; do not implement text hand input in MVP.
- [x] Use MVP hand-efficiency output: shanten number, effective tile list, and total effective tile count; defer user-facing normal/chiitoi/kokushi branch detail.
- [x] Support red dora in quick scoring MVP.
- [x] Exclude kyoutaku / riichi-stick deposit settlement from quick scoring MVP.
- [x] Use modern standard riichi yaku plus common yakuman for MVP; exclude local yaku and old yaku from the main scoring engine.

## Phase 1. Domain Foundation

- [x] Create tile model and keyboard-selection contracts under `src/domain/mahjong/`.
- [x] Represent red fives for manzu, pinzu, and souzu, while validating them against the normal physical five-tile count.
- [ ] Implement tile validation:
  - physical tile count;
  - hand length;
  - winning tile position;
  - meld count;
  - four-player vs three-player constraints.
- [ ] Implement sanma validation and scoring constraints:
  - north-dora count;
  - no chi;
  - common Japanese sanma tsumo-loss settlement;
  - user-facing sanma rule warning.
- [x] Add point calculation API:
  - dealer/non-dealer;
  - ron/tsumo;
  - han/fu to payments;
  - limit classes.
- [ ] Add dora counting tests covering dora indicators, ura-dora indicators, red dora, and three-player north-dora count.
- [x] Add MVP smoke tests covering point-table rows, red dora, dora indicators, no-yaku handling, hand-efficiency fallback, physical tile count validation, and practice point fixtures.
- [ ] Add validated point-table fixtures for screenshot-visible cases:
  - 1 han 30 fu dealer tsumo 500, dealer ron 1500, non-dealer tsumo 300/500, non-dealer ron 1000;
  - 1 han rows visible in quick lookup;
  - representative 2 han 20/25/30 fu rows.
- [ ] Add fu calculation API and tests for:
  - chiitoitsu 25 fu;
  - base fu;
  - menzen ron;
  - tsumo;
  - waits;
  - triplets/quads;
  - pair fu;
  - double-wind pair option.
- [x] Add yaku data and yaku detail contract.
- [x] Add modern standard riichi yaku and common yakuman fixtures; keep local-yaku and old-yaku data out of the main scoring engine.

## Phase 2. App Routes And Shared UI Components

- [x] Replace template home with screenshot-confirmed feature entries.
- [x] Use Pencil exports for frontend page hierarchy and state coverage, especially:
  - home grouping;
  - quick scoring result/warning states;
  - tile keyboard;
  - practice feedback;
  - yaku list/detail;
  - han/fu calculator/table;
  - help tables;
  - contact and placeholder states.
- [x] Add route definitions in `src/app.json`.
- [x] Create shared components:
  - tile display;
  - wind selector;
  - yaku condition selector;
  - han/fu selector;
  - practice answer panel.
- [x] Add placeholder page for entry-only modules if they remain visible:
  - chat-style scoring;
  - old-yaku scoring;
  - table-score records.
- [x] Add a placeholder or hide physical hand recognition unless explicitly brought into MVP.

## Phase 3. Quick Scoring

- [x] Build quick scoring input page with screenshot-confirmed fields.
- [ ] Build the bottom-sheet tile keyboard for hand, meld, dora, and ura-dora input:
  - ordered tile preview;
  - suit tabs;
  - tile grid;
  - red-five selection for hand and meld input;
  - max-count warnings;
  - delete, clear, and done actions.
- [x] Wire keyboard selection state to validation.
- [x] Implement four-player and three-player action paths.
- [x] Implement reset action.
- [x] Implement result page for scoring results.
- [x] Implement hand-efficiency fallback page/state showing shanten number, effective tile list, and total effective tile count.
- [x] Add invalid-input and rule-conflict messages.

## Phase 4. Lookup And Help

- [x] Implement interactive han/fu point calculator.
- [x] Implement han/fu quick lookup table with 1 through 13 han navigation.
- [x] Implement fu help content from screenshot evidence.
- [x] Implement point calculation help content from screenshot evidence.
- [x] Implement yaku list.
- [x] Implement yaku detail page with at least `断幺九` as a fixture, then expand yaku data.

## Phase 5. Practice Modules

- [ ] Implement shared practice state helper:
  - current question;
  - answer draft;
  - submit;
  - correct answer;
  - correct streak;
  - feedback.
- [x] Implement chinitu wait practice.
- [x] Implement fu calculation practice.
- [x] Implement point calculation practice with embedded han/fu lookup reference table.
- [x] Implement comeback han/fu practice.
- [x] Show practice feedback with correctness, standard answer, user answer, and a short breakdown when available.
- [ ] Add answer-checking tests for each practice mode.
- [x] Keep practice unrestricted with no ad gate or ad-view unlock.

## Phase 6. Records, Sharing, And Feedback

- [x] Implement contact/feedback entry with a minimal confirmed behavior.
- [x] Implement lightweight share-result / share-page behavior where WeChat supports it.
- [x] Keep table-score records as placeholder until fields and flow are specified.

## Validation Commands

Use project scripts before ad-hoc commands:

```bash
pnpm test
pnpm build
pnpm lint
pnpm stylelint
```

When runtime pages exist and WeChat DevTools is available:

```bash
pnpm dev
wv screenshot --output .tmp/acceptance.png
```

For domain-heavy scoring work, add focused tests before relying only on mini-program runtime checks. If the project has no test runner yet, add one deliberately as part of the domain foundation step.

## Review Gates

- [x] Every screenshot-confirmed module is either implemented or explicitly marked placeholder in product copy.
- [x] Every frontend page implemented in MVP has been checked against the relevant Pencil PNG/HTML reference for expected state coverage.
- [x] No ad creatives, ad placement implementation, payment, membership, shopping, coupon, order, refund, or points-mall modules were added.
- [x] No practice ad gate or ad-view unlock was added.
- [x] Local-yaku and old-yaku scoring are not part of the main scoring engine.
- [ ] Quick scoring math has domain tests for representative yaku/fu/point cases.
- [ ] Practice answer checking uses the same shared rule engine as quick scoring/lookup where possible.
- [x] Help pages and lookup pages share data with calculators where practical.
- [x] `src/app.json` route list matches created pages.
- [x] Build succeeds with `pnpm build`.
- [x] Runtime screenshot acceptance uses WeChat DevTools / weapp-vite automation rather than generic browser screenshots.

## Risky Files And Rollback Points

- `src/app.json`: route mistakes can break mini-program startup.
- `src/domain/mahjong/**`: scoring rule mistakes can affect multiple modules.
- `src/pages/index/**`: replacing the template home changes the first user-visible screen.
- Practice generators: invalid generated questions can erode trust quickly.
- Static lookup/yaku data: duplicated constants can drift from domain calculations.

Rollback strategy:

- Keep domain module commits separate from page wiring where possible.
- Validate point-table data before connecting practice modules.
- Leave entry-only modules as placeholders instead of partial implementations when scope is unclear.
