# Clearly Reformed Mobile — Technical Stack Specification

Companion to `project-info.md` (product vision). This document fixes the concrete stack. Bias: well-established, well-maintained libraries that won't break easily. No code — library-per-concern.

---

## 1. Core App

- **Framework:** React Native via **Expo** (latest SDK). Cross-platform iOS + Android from one codebase.
- **Build profile:** Expo **dev build** (custom dev client), NOT Expo Go — required because we use native modules (Skia, audio, embeddings runtime, secure storage) that Expo Go does not bundle.
- **Language:** **TypeScript**, `strict` mode on.
- **Navigation:** **Expo Router** (file-based routing; built on React Navigation, the de-facto standard).
- **Package manager:** **pnpm**.
- **Builds & releases:** **EAS Build** (cloud native builds), **EAS Submit** (App Store / Play Store upload), **EAS Update** (OTA JS updates for fast non-native patches).
- **Node version pinning:** `.nvmrc` / Volta.

## 2. Server Data (read-only content API)

- **Server cache + fetching:** **TanStack Query** (React Query) — caching, pagination, background refetch, ret/stale handling for all WordPress + RSS reads.
- **HTTP:** native **`fetch`** wrapped in a thin typed client. No axios/ky dependency.
- **RSS parsing:** **`fast-xml-parser`** for the *Life and Books and Everything* feed (`media.rss.com/lbe/feed.xml`).
- **HTML sanitation/processing:** server-side content (`content.rendered`) is normalized into our own HTML for the Reader; sanitize with a lightweight allowlist pass before injecting into the WebView.
- **Primary content endpoint:** `kdy/v1/all-resources` (unified, pre-computed feed) backs the home/library; per-type `wp/v2/*` endpoints back detail and filtered views; `cr/v1/articles` for the articles list + `has_booklet` flag.

## 3. Local-First Data (the personal layer)

One local database, clear table groups — deliberately consolidated for maximum stability:

- **Local store (everything):** **`expo-sqlite`** — first-party Expo, rock-solid, modern async API. A single on-device database holding:
  - **Notebook tables (synced):** highlights, notes, bookmarks, playback positions — the personal layer.
  - **Content tables (cache/offline):** downloaded/saved articles, transcripts, episode metadata, playback queue.
  - **FTS5 index:** offline keyword search over saved content + notebook (see §7).
  - Consolidating on one battle-tested, first-party store removes third-party sync-engine risk entirely: there is no library between us and SQLite/Postgres — just our own small sync layer (§4).
- **Reactive reads:** **TanStack Query** wraps SQLite reads (SQLite as the queryable source); mutations write to SQLite then invalidate the affected queries, so the UI updates without a separate reactive store.
- **Settings/preferences:** **`react-native-mmkv`** — fast synchronous KV for render-time prefs (theme, reader typography). Stable, battle-tested.
- **Secrets:** **`expo-secure-store`** — auth session tokens / device keys (Keychain / Keystore backed).

## 4. Sync Backend (opt-in only)

- **Backend:** **Supabase** — Postgres + Row Level Security + Auth + Storage + **pgvector**. One backend serves both notebook sync and semantic search.
- **Sync engine:** **custom last-write-wins sync** — a small, self-contained pull/push layer between the local `expo-sqlite` notebook tables and Postgres. Pull: fetch rows changed since the last `updated_at` watermark. Push: upsert locally-changed (`pending`) rows. No third-party sync engine — the only moving parts are SQLite, Postgres, and ~one well-scoped module of our code. Runs on sign-in, on app foreground, and after local writes (debounced).
- **Conflict resolution:** **per-field last-write-wins** keyed on `updated_at` (CRDTs are overkill for single-user/multi-device). **Playback position** uses a custom **most-recently-active-device-wins** merge so progress never rewinds.
- **Row model:** every synced row carries `id`, `user_id`, `created_at`, `updated_at`, `deleted` (soft delete), plus a local-only `pending` flag for unsynced writes; a per-table `last_synced_at` watermark drives incremental pull. RLS restricts every row to `auth.uid()`.
- **Account-optional model:** app is fully usable with **no account** (local-only); sync is the only feature that requires sign-in. No anonymous Supabase sessions — a real account is created **only at opt-in** (avoids anonymous-user MAU/cleanup overhead). First sync bulk-uploads existing local rows.
- **Cost note:** Supabase free tier pauses after ~7 days idle — fine pre-launch; budget a keep-alive ping or Pro tier at launch.

## 5. Authentication (friction-free, minimal PII)

- **Provider:** **Supabase Auth.**
- **Methods:** **Sign in with Apple** (`expo-apple-authentication`, with Hide My Email) + **Google Sign-In** (`@react-native-google-signin/google-signin`) — Apple for iOS, Google for Android; optional **magic-link** email as universal fallback.
- **Compliance:** offering Sign in with Apple alongside Google satisfies App Store Guideline 4.8; key sync rows on the opaque provider user ID, never a stored real email (Hide My Email relays).
- **Account deletion:** in-app, mandatory (Guideline 5.1.1(v)) — a Supabase **Edge Function** invokes admin delete + purges the user's rows.

## 6. Audio & Video

- **Audio player:** **`react-native-track-player`** — background playback, lock-screen controls, **CarPlay + Android Auto**, queue, 1.0–2.0× speed, sleep timer. The mature choice for this exact job.
- **Video:** **`expo-video`** (current Expo video module; replaces deprecated `expo-av` video).
- **Offline downloads:** **`expo-file-system`** — download audio + article/transcript assets to device; download manager state tracked in `expo-sqlite`.
- **"Continue" / resume:** playback positions live in the Notebook store (§3), so resume works cross-device once sync is on and offline always.

## 7. Search

- **Online — semantic (signature feature):** hosted pipeline, no on-device model.
  - **Embeddings:** **Voyage AI** (`voyage-3.5`, or `voyage-3.5-lite` for cost) — Anthropic's recommended embedding partner; corpus chunks embedded at ingestion, query embedded at request time. Vectors stored in **Supabase pgvector**. (Swappable alternative: OpenAI `text-embedding-3-small`.)
  - **Query understanding + cited synthesis:** **Anthropic Claude** via a Supabase **Edge Function** (API key stays server-side). **`claude-haiku-4-5`** for the cheap query-rewrite/expansion step; **`claude-opus-4-8`** (or `claude-sonnet-4-6` for cost) for cited answer synthesis, streamed. Results always cite + deep-link back to the source item/timestamp.
  - **Reranking (optional):** Voyage `rerank-2` over the pgvector candidate set before synthesis.
  - **Ingestion:** scheduled Edge Function (via **pg_cron**) polls the WordPress API for new/updated content, chunks, embeds (Voyage), and upserts into pgvector. Audio coverage depends on transcript access (`searchrovr-transcribe/v1`); launch text-first, add podcast/sermon transcripts as a fast-follow (self-generate via Whisper if the ministry can't provide them).
- **Offline — keyword only:** **SQLite FTS5** over saved/downloaded content + the notebook. No ML; this is the only sensible offline search since the full corpus lives server-side.
- **Baseline keyword (online):** `wp/v2/search` proxied for simple title/type matches when semantic isn't warranted.

## 8. The Reader

- **Layout/pagination engine:** **`react-native-webview`** rendering *our own* HTML + CSS (not a third-party reader). CSS **multi-column** does pagination; the WebView gives correct line-breaking, hyphenation, and reflow for free. User never perceives it as a web page.
- **Typography controls:** font size, font family (Flecha / IBM Plex Sans), line spacing, margins — all CSS, recalculated on change.
- **Reading modes:** **Curl / Slide / Scroll** toggle.
- **Page-curl animation:** **`@shopify/react-native-skia`** runtime shader warping a snapshotted page around a cylinder (the Candillon "Riveo" technique); **`react-native-reanimated`** + **`react-native-gesture-handler`** drive curl progress from the finger on the UI thread.
- **Reading position:** stored as a **content offset** (not a page number), so it survives type-size/margin/screen changes.

## 9. Notifications

- **Client:** **`expo-notifications`** — registration, permissions, per-category opt-in toggles (new article / episode / video / conference).
- **Delivery:** Expo Push Service → APNs + FCM. Device push tokens stored in Supabase.
- **Trigger:** the same pg_cron ingestion job (§7) detects new content and dispatches pushes via an Edge Function to subscribed tokens.

## 10. UI / Presentation

- **Styling:** React Native **`StyleSheet`** + a typed in-house **theme module** (color tokens incl. the sage/gold palette, a typographic scale, spacing). Zero third-party styling-engine churn — the most "won't break" option.
- **Fonts:** **`expo-font`** loading Flecha (display serif) + IBM Plex Sans (UI/body) from `design/fonts`.
- **Images:** **`expo-image`** (disk/memory caching, fast loads, blurhash placeholders).
- **Layout chrome:** **`react-native-safe-area-context`** + **`react-native-edge-to-edge`**.
- **Sheets/overlays:** **`@gorhom/bottom-sheet`** for the now-playing/audio sheet and contextual menus.
- **Gestures/animation (shared):** `react-native-gesture-handler` + `react-native-reanimated` (also used by the Reader).

## 11. Quality, Observability, Ops

- **Crash/error monitoring:** **Sentry** (`@sentry/react-native`).
- **Product analytics (optional, privacy-first):** **PostHog** — opt-in, no PII; or omit for v1.
- **Lint/format:** **ESLint** + **Prettier**.
- **Unit/component tests:** **Jest** + **React Native Testing Library**.
- **E2E flows:** **Maestro** (lightweight, RN-friendly).
- **CI:** GitHub Actions running lint + typecheck + tests; EAS for build/submit.

## 12. Stack Summary (one line each)

- Cross-platform shell → **Expo + React Native + TypeScript**, dev build, **Expo Router**.
- Server reads → **TanStack Query** + `fetch`; RSS via **fast-xml-parser**.
- Local store → single **expo-sqlite** DB (notebook + content + **FTS5**); reactive via **TanStack Query**; settings in **react-native-mmkv**.
- Notebook sync → **custom last-write-wins** pull/push to **Supabase** (no third-party sync engine; per-field LWW, playback most-recently-active-device-wins).
- Auth → **Supabase Auth**: **Sign in with Apple** + **Google**, account-optional.
- Audio → **react-native-track-player**; video → **expo-video**; downloads → **expo-file-system**.
- Semantic search → **Voyage** embeddings + **Supabase pgvector**, **Claude** (Haiku query-rewrite, Opus/Sonnet synthesis) in **Supabase Edge Functions**.
- Reader → self-styled **react-native-webview** layout + **Skia** page-curl + **Reanimated/Gesture Handler**.
- Notifications → **expo-notifications** + Expo Push, triggered by **pg_cron** Edge Function.
- UI → **StyleSheet** + typed theme, **expo-font**, **expo-image**, **@gorhom/bottom-sheet**.
- Ops → **EAS**, **Sentry**, **Jest** + **RNTL**, **Maestro**, **ESLint/Prettier**.
