# Clearly Reformed Mobile — Project Orientation

Read this first. It orients a fresh session; the detail lives in the linked docs.

## What this is

A cross-platform mobile app (React Native + Expo) — the best way to consume the content of **Clearly Reformed**, the ministry of Kevin DeYoung (articles, the *Life and Books and Everything* podcast, explainer videos, sermons, lectures, books, Coram Deo conference). Brand: "Theology for the everyday" — a calm, editorial, literary-journal feel (cream/sage-green/gold palette, Flecha display serif + IBM Plex Sans).

**Status:** planning complete, pre-development. No code yet. (Note: client greenlight pending — see prereqs.)

## Canonical docs (source of truth)

- **`project-info.md`** — product vision, audience, features (3 tiers), MVP vs v2 scope.
- **`SPEC.md`** — the locked technical stack, library-per-concern.
- **`API_DOCUMENTATION.md`** — the content API (WordPress REST + podcast RSS), incl. the discovered-endpoints addendum.
- **`design/`** — fonts (Flecha, IBM Plex Sans), icons, color token, website screenshots. No mobile UI designs yet (see prereqs).

## Locked decisions (do not relitigate without reason)

- **App:** React Native + **Expo** (dev build, not Expo Go) + **TypeScript** strict; **Expo Router**; pnpm.
- **Local data:** a single **`expo-sqlite`** database for notebook + saved content + FTS5. Reactive via **TanStack Query**. No third-party sync engine.
- **Sync (opt-in):** small **custom last-write-wins** pull/push to **Supabase** Postgres (per-field LWW; playback = most-recently-active-device-wins). Account-optional (local-only works with no account).
- **Auth:** Supabase Auth — **Sign in with Apple + Google**, account only for sync; in-app account deletion.
- **Media:** `react-native-track-player` (audio, CarPlay/Android Auto), `expo-video`, `expo-file-system` downloads.
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

- **Mobile UI/UX design** — the one real gap. Brand assets exist; screen designs don't. Sketch IA + home/library, reader, now-playing before going wide.
- **Apple Developer Program** ($99/yr) + **Google Play Console** ($25) — for device builds, push, stores. Simulator dev works without.
- **CarPlay entitlement** — Apple approves by request; slow, start early.
- **Flecha font license** — verify it permits **app-binary embedding** (web license ≠ embedding license). IBM Plex is OFL (fine).
- **Feature-gated (not needed for v1):** Supabase project (sync), Anthropic + Voyage API keys (search), audio transcript access via `searchrovr-transcribe` (gates *audio* in search only).

## Conventions

- TypeScript strict; ESLint + Prettier.
- Dev build required (Skia, track-player, secure-store, etc. don't run in Expo Go).
- Use SDK/library types; don't redefine API shapes.
- This is currently **not** a git repo — initialize one before first commit.
