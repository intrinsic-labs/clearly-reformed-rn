# Clearly Reformed Mobile — Project Orientation

Read this first. It orients a fresh session; the detail lives in the linked docs.

## What this is

A cross-platform mobile app (React Native + Expo) — the best way to consume the content of **Clearly Reformed**, the ministry of Kevin DeYoung (articles, the *Life and Books and Everything* podcast, explainer videos, sermons, lectures, books, Coram Deo conference). Brand: "Theology for the everyday" — a calm, editorial, literary-journal feel (cream/sage-green/gold palette, Flecha display serif + IBM Plex Sans).

**Status:** MVP feature-complete (July 2026), device-tested and on TestFlight with real users; iterating on their feedback. All v1 slices are built: app shell, Library feed, Reader (WebView layout, typography, Scroll/Slide/Curl-lite), audio (track-player fork, Now Playing, mini-player, downloads), local-first SQLite personal layer (highlights/clips/notes/progress/saved + FTS5), Notebook tab, Home daily surface + Continue, keyword Search with offline fallback, notification prefs + daily reminder, Settings. Not built (by design, v1.1/v2): sync/auth, semantic search, real push delivery, Skia page-curl shader (Curl mode currently runs the slide engine with an edge shade — see the Reader commit). (Greenlit 2026-08-15: two-year $500/mo retainer, expanded scope — see Stakeholder in the brief.)

## Canonical docs (source of truth)

- **`project-info.md`** — product vision, audience, features (3 tiers), MVP vs v2 scope.
- **`SPEC.md`** — the locked technical stack, library-per-concern.
- **`API_DOCUMENTATION.md`** — the content API (WordPress REST + podcast RSS), incl. the discovered-endpoints addendum.
- **`design/`** — fonts (Flecha, IBM Plex Sans), icons, color token, website screenshots, plus **`clearly-reformed-app-mockup-2026/`** — five Claude Design screen mockups (Home, Library, Notebook, Now Playing, Reader). Use the raw `.dc.html` files as the translation source; screenshots are the visual reference. Its `uploads/` folder is the frozen input bundle that was handed to Claude Design — the `SPEC.md`/`project-info.md` copies in there are point-in-time snapshots, not live docs.

## Locked decisions (do not relitigate without reason)

- **App:** React Native + **Expo** (dev build, not Expo Go) + **TypeScript** strict; **Expo Router**; pnpm.
- **Local data:** a single **`expo-sqlite`** database for notebook + saved content + FTS5. Reactive via **TanStack Query**. No third-party sync engine.
- **Sync (opt-in):** small **custom last-write-wins** pull/push to **Supabase** Postgres (per-field LWW; playback = most-recently-active-device-wins). Account-optional (local-only works with no account).
- **Auth:** Supabase Auth — **Sign in with Apple + Google**, account only for sync; in-app account deletion.
- **Media:** `react-native-track-player` (audio, CarPlay/Android Auto), `react-native-youtube-iframe` (video — the catalog's video is all YouTube-hosted, which exposes no direct stream for a native player), `expo-file-system` downloads.
- **Reader:** self-styled `react-native-webview` for layout/pagination (our HTML/CSS, CSS multicol) + **Skia** page-curl shader + Reanimated/Gesture Handler. Modes: Curl / Slide / Scroll. Position stored as content offset.
- **Semantic search (signature, v2):** hosted only — **Voyage** embeddings + Supabase **pgvector** + **Claude** (Haiku query-rewrite, Opus/Sonnet synthesis) in Supabase Edge Functions. Always cites sources. *Offline whole-corpus search was rejected as pointless* — offline search is **SQLite FTS5** over saved content only.
- **Booklets:** `has_booklet` is just a display badge. Booklet text == article body (confirmed), so the Reader renders article text natively — **no Publuu dependency**.
- **Cut:** topical threads (dropped entirely).

## Build order (suggested first slices)

1. **App shell** — Expo dev build, theme module (palette + type scale), `expo-font` (Flecha + IBM Plex Sans), Expo Router nav.
2. **Unified library** — fetch `kdy/v1/all-resources` via TanStack Query; magazine-style feed. *This needs only the public API — no accounts, no paid services. Best first proof of API + visual direction.*
3. **Detail + Reader** — article reader (WebView layout + typography controls; Skia curl after).
4. **Audio** — track-player, background/lock-screen, downloads, "Continue".
5. **Notebook (local-only)** — expo-sqlite tables, highlights/notes/bookmarks.
6. **Daily surface + notifications.**
7. **(v1.1+)** opt-in sync + auth → then semantic search.

MVP vs v2 split is in `project-info.md` §11.

## Prerequisites / things to line up (not code blockers, but gate features or shipping)

- **Mobile UI/UX design** — the core screens are designed (`design/clearly-reformed-app-mockup-2026/`: Home, Library, Notebook, Now Playing, Reader). Secondary surfaces (detail pages, Search, Settings, onboarding) still follow the mockups' tokens rather than their own designs.
- **Apple Developer Program** ($99/yr) + **Google Play Console** ($25) — for device builds, push, stores. Simulator dev works without.
- **CarPlay entitlement** — Apple approves by request; slow, start early.
- **Flecha font license** — verify it permits **app-binary embedding** (web license ≠ embedding license). IBM Plex is OFL (fine).
- **Feature-gated (not needed for v1):** Supabase project (sync), Anthropic + Voyage API keys (search), audio transcript access via `searchrovr-transcribe` (gates *audio* in search only).

## Conventions

- TypeScript strict; ESLint (with clean-architecture boundaries) + Prettier.
- Dev build required (track-player, sqlite, etc. don't run in Expo Go). After native
  dep changes run `npx expo run:ios` (rebuilds the dev client + pods); day-to-day is
  `pnpm start`.
- Verify with: `pnpm typecheck`, `pnpm lint`, `pnpm test` (jest-expo; pure-logic units).
- Use SDK/library types; don't redefine API shapes.
- Audio player is the Apache-2.0 fork `@javascriptcommon/react-native-track-player`
  (upstream v4 is frozen/broken on RN 0.85; official v5 `@rntp/player` is commercial —
  revisit licensing before launch).

### Patched dependencies

Four deps ship patched via `pnpm patch` — the patch files live in `patches/`, wired up
by `patchedDependencies` in `pnpm-workspace.yaml`:

- **`react-native-enriched-markdown@1.0.1`** (highest stakes) — routes the note
  editor's iOS font resolution through `RCTFont` (`applyInputStyleProps`,
  `headingFontForLevel`) instead of a bare `[UIFont fontWithName:]`. The app passes
  **expo-font aliases** (`IBMPlexSans_400Regular`, see `theme/index.ts`), which UIKit
  does not know by name — unpatched, the editor silently falls back to San Francisco
  and headings jump to the system font. This is the one that fails *quietly*. Its
  native assets also arrive via a postinstall download, permitted by `allowBuilds` in
  the same file — a working install needs both entries.
- **`react-native-webview`** — two Reader-specific iOS changes in `RNCWebViewImpl.m`:
  `buildMenuWithBuilder` strips the system text-selection edit menu (the app owns
  selection in paged mode, and the system menu lands off-screen on column-split
  paragraphs), and `didMoveToWindow` tints WKWebView's native selection chrome gold to
  match the reader's own selection painting. Neither is reachable through props — and
  specifically **not** via the `menuItems` prop, whose long-press recognizer corrupts
  WebKit's selection gesture.
- **`expo-splash-screen`** — optional-chaining guards in the config plugin's
  `InterfaceBuilder.js`. Our iOS splash is background-colour only (no image), so the
  generated `SplashScreen.storyboard` has no `<subviews>`/`<constraints>` and the
  plugin's `mainView.subviews[0]` throws during prebuild.
- **`@javascriptcommon/react-native-track-player`** — adds the missing `Event` import
  to `useTrackPlayerEvents` in both `src/` and `lib/src/` (Metro resolves `src/`). The
  fork's `__DEV__` validation reads `Event` as a global, which throws on Hermes the
  moment any track-player hook mounts. See `f910363`.

**Rule: upgrading or reinstalling a patched dep means re-verifying its patch** —
`pnpm patch <name>`, re-apply the change against the new source, `pnpm patch-commit`.
Install fails loudly when hunks no longer apply, so a breaking upgrade is usually
visible; what isn't is a patch that still applies but no longer covers code upstream
moved or renamed. Three of the four are native/config-plugin code, so verifying one
means a rebuild (`npx expo run:ios`), not a Metro reload — and none of them are
reachable by `pnpm typecheck`/`pnpm test`.
