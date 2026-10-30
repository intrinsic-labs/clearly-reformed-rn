# AGENTS.md — Clearly Reformed mobile

Read [CLAUDE.md](CLAUDE.md) first. It is the project orientation (product, locked stack, conventions, patched dependencies) and applies to every agent, not only Claude. This file adds the two engineering handbooks and the rules for keeping them true.

## Where to look

- **[FEATURE_MAP.md](FEATURE_MAP.md):** every user-visible feature, with how to reach it, its selector, its owning code and its data (WordPress endpoint, RSS, SQLite table or kv key), plus whether it's live, placeholder or unavailable. Start a bug report or screenshot here: find the entry, then follow `Code:` and `Backend:`.
- **[VERIFY.md](VERIFY.md):** a cold start to the app running on the iOS Simulator and the Android Emulator: environment, builds, Metro, driving with Maestro, deep links, disposable study data and reset, offline, screenshots, checks, cleanup and the native build gotchas this repo actually hits.

## Rules

- **Change a route, screen or feature and you update its map entry in the same change.** Add entries for new features and remove entries for removed ones. Then run the map check from VERIFY.md → Checks with `--strict`.
- **Bump the map's `revision:`** only after re-reading every entry the check's drift warnings name. Bump `reconciled:` only after walking every entry in the running app.
- **Selectors are `testID`s on host elements,** named after the map ID (`library.feed` → `library-feed`). A selector is `working` only once you've seen it in a rendered `maestro hierarchy`. Note platform gaps in the entry: on iOS, an accessible parent can hide a child's ID.
- **When a VERIFY.md step fails or you had to improvise, fix the guide in the same change,** and add the failure to its Gotchas if it cost real time. Update "Last proven" only after a real end-to-end run.
- **Never commit** anything under `ios/`, `android/` or your scratch directory.
- **Product defects you find while mapping or verifying** get reported separately, not quietly fixed inside a docs change.
