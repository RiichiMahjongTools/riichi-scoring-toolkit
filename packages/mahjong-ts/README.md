# mahjong-ts

Workspace TypeScript port of the riichi mahjong hand calculation pieces used by this app.

This package is kept in-repo while the local extensions are still settling. It exports source TypeScript directly for the Vite workspace build and can later be published after the API is stabilized.

## Current Scope

- Hand value calculation through `HandCalculator`.
- Fu and score calculation through `FuCalculator` and `ScoresCalculator`.
- Shanten calculation through `Shanten`.
- Effective tile calculation through `EffectiveTiles`.
- Three-player score handling through `OptionalRules.is_three_player`.
- Configurable double-wind pair fu through `OptionalRules.double_wind_pair_fu`.

## Development

```bash
pnpm --filter mahjong-ts typecheck
pnpm --filter mahjong-ts test
pnpm --filter mahjong-ts build
```

The app currently consumes this package through `workspace:*`.
