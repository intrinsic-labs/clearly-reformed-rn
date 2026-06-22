# Clearly Reformed Mobile App — Product Vision & Stack

Intrinsic Labs LLC • asher.pope@intrinsiclabs.co • 615.935.0853
*Revised vision document — supersedes the original 11-screen native scope.*

---

## 1. The Thesis

Clearly Reformed is the resource ministry of Kevin DeYoung — "Theology for the everyday." Its content (articles, explainer videos, the *Life and Books and Everything* podcast, sermons, lectures, books, and the Coram Deo Pastors Conference) currently lives scattered across the website, YouTube, and the podcast platforms. The website is an excellent **catalog**. No product today is the **companion** — the thing in your pocket at the gym, in the car, and on the couch at night.

**That is what this app is.** Not a reproduction of the website, but the single best *home* for someone who follows this ministry. We win by doing three things the web fundamentally cannot:

1. **A unified library** of everything the ministry produces, in one calm, beautifully made place.
2. **A personal study layer** — highlights, notes, and bookmarks that span *all* media and belong to the user, fully usable offline.
3. **A daily reason to return** — the website is something you visit; an app is something you open.

The brand's one-word soul is **clarity**, and its visual language is a literary theological journal: cream paper, dark teal-green and gold/ochre, an old-style serif. The app should feel like a beautifully printed book that happens to play audio and video — restraint, not media-app clutter.

## 2. Audience

Doctrinally-serious Reformed Protestants — PCA / Reformed Baptist pastors *and* educated lay Christians who value books, rigor, and a confident counter-cultural posture. They commute, they read, they listen to long-form audio. Two notes that shape product decisions:

- This audience is **wary of anything that feels like an "AI pastor."** AI must surface *his* words, never invent answers.
- A client priority: **users must not be forced to create an account just to use the app.**

The category benchmark is the Ligonier app (single ministry, multi-format library, free); the UX benchmark is Solid Joys / Obsidian (focused, elegant, low-friction, local-first).

## 3. Why Mobile (the strategic bet)

The four things a phone gives that a browser cannot, in priority order:

1. **Audio/video that follows you off-screen** — background playback, lock-screen + CarPlay / Android Auto controls, offline downloads, speed control, sleep timer, "continue where you left off." Half this content is meant to be consumed while doing something else.
2. **A persistent, offline personal layer** — highlights/notes/bookmarks and saved content that live with the user with no internet, optionally syncing across devices.
3. **A daily habit** — a home surface that always has something for today.
4. **Push notifications** — the re-engagement loop the website has no way to do.

## 4. Core Features

### Tier 1 — Foundation (beats the status quo on its own)
- **Unified library** of Articles, Videos, Podcast, Sermons, Lectures, Books, and Conference media — magazine-feeling, Flecha-led, not a generic list app. Backed by the API's pre-computed unified feed.
- **First-class audio player** — background, lock screen, CarPlay / Android Auto, offline downloads, 1.0–2.0× speed, sleep timer, queue.
- **The Reader** (see §6) — a clean, book-like reading experience for articles and booklets with adjustable typography and a real page-turn animation.
- **Cross-content "Continue"** — resume any episode, article, or reading from exactly where you stopped, anywhere in the app.
- **Offline-first saved content** — articles, transcripts, and downloaded audio are available with no internet. (Video is the one exception, due to size and licensing.)
- **Smart notifications** — granular per-category toggles (new article / episode / video / conference) so people keep them on.

### Tier 2 — Makes it theirs (the stickiness)
- **The cross-media Notebook.** Highlight a sentence in an article, *and* a timestamped moment in a podcast or video (a clippable quote). All of it lands in one personal notebook — searchable, taggable, exportable, and fully functional offline. Timestamped audio/video highlighting is the standout: almost nobody in this space does it well.
- **A daily surface.** The ministry has no daily devotional, but one can be *composed* from the existing corpus — a rotating "Today" card (a short article, a video, a quote, an excerpt). Low effort, high engagement, perfectly on-brand.

### Tier 3 — The signature feature
- **Semantic search across the entire DeYoung corpus** (see §8). "What has Kevin said about anxiety / divine simplicity / Christian nationalism?" → returns the relevant articles, the exact podcast/sermon timestamps, and video moments, each cited back to its source. It is the thing the website is worst at, it maps directly onto the brand word *clarity*, it respects the audience (it surfaces *his* words rather than generating answers), and it is a genuine engineering showcase.

## 5. Content & API

Content is pulled from a WordPress REST API (`control.kdy.org/wp-json`) and the podcast RSS feed (`media.rss.com/lbe/feed.xml`). The API is far richer than the originally-scoped three endpoints:

- **`kdy/v1/all-resources`** — a pre-computed, unified, chronological feed of every content type with normalized people, images, and dates. The natural backbone for the home feed and the unified library.
- **`cr/v1/articles`** — the mobile-optimized articles list (includes the `has_booklet` flag).
- **Large `wp/v2` inventory** — ~1,974 posts, ~1,018 sermons, ~310 podcast episodes, ~92 lectures, ~36 books, plus conference and Coram Deo content. Rich taxonomies: `associated_people` (speakers/authors), `series`, `sermon_keywords`, and `bible_book` (enables browsing by Scripture).
- **`wp/v2/search`** — keyword full-text search across all types. This is the baseline that semantic search is built on top of, not a replacement for it.
- **`searchrovr-transcribe/v1`** — a transcription namespace. If audio transcripts are accessible, they are the fuel for semantic search over podcasts and sermons. *To confirm with the API owner.*
- **Podcast RSS** — 194+ episodes with full iTunes metadata (episode number, audio URL, duration, description, per-episode art).
- **Full article text** is retrieved via `wp/v2/posts?slug={slug}` (`content.rendered`). This is what the Reader renders — we lay the text out ourselves rather than replicating any PDF.

## 6. The Reader

The Reader is a custom, native-feeling reading experience — not an embedded third-party PDF/EPUB viewer. Articles and booklets are reinterpreted from their source text into a clean, book-like layout that belongs to the app.

- **Layout via a fully self-styled, hidden WebView.** We pull the article/booklet text from the API and render it inside a WebView whose HTML and CSS are entirely ours. The WebView is purely the layout engine; the user never perceives it as a web page. This is a deliberate decision: native text pagination in React Native is extremely costly to build and maintain, while a WebView gives correct line-breaking, hyphenation, and CSS multi-column pagination essentially for free. It also cleanly supports all the typography controls we want.
- **Typography controls** — adjustable font size, font family (Flecha for a literary feel, IBM Plex Sans for a cleaner UI feel), line spacing, and margins. CSS recalculates page breaks to the screen size whenever any setting changes.
- **Reading modes** — a toggle between **page-turn** mode and **vertical scroll** mode (read it like a book, or like a blog post), mirroring the Apple Books model.
- **The page-turn animation** — a real, finger-tracking 3D page curl built with **React Native Skia**: the rendered page is snapshotted to a texture and warped around a cylinder by a runtime shader, with the curl progress driven by a gesture on the UI thread so it tracks the finger and can be done slowly. This approximates the Apple Books curl closely without building a 3D engine, and it composes cleanly over the WebView layout. Modes offered: **Curl / Slide / Scroll.**
- **Reading position** is stored as a content offset (not a page number), so it survives changes to font size, margins, and screen size.

## 7. Resolved Decisions & Remaining Questions

- **Booklets need no special handling (resolved).** A booklet's text is the same as the article body, which we already pull from the API. The designed booklets live on Publuu (a third-party flipbook viewer), but we do not need Publuu: the Reader renders the same article text natively. `has_booklet` is used only as a flag — e.g. to show a "Booklet" badge on a piece of content, as the website does.
- **Audio transcripts (open).** Semantic search can only search text, so covering spoken content (the podcast and ~1,018 sermons) requires transcripts. The API exposes a `searchrovr-transcribe/v1` namespace, implying a transcription service already exists — the question is whether finished transcripts are retrievable. If yes, semantic search can return exact timestamped moments inside episodes and sermons. If transcripts are not readily available, the plan is to **launch semantic search over text content (articles/posts) and add audio as a fast-follow**, generating transcripts in our own ingestion pipeline (e.g. Whisper) if the ministry cannot provide them.

## 8. Semantic Search Architecture

One embedding model, one shared vector space, two modes. The non-negotiable rule: the **same embedding model, tokenizer, and pooling** are used to build the server index and to embed queries on-device — cosine similarity is only meaningful within a single model's space.

- **Embedding model:** `bge-small-en-v1.5`, int8 quantized (~32 MB) — best retrieval quality per megabyte for a downloadable feature.
- **Online mode (default):** the corpus (articles plus transcripts where available) is chunked, embedded server-side, and stored in a **Supabase pgvector** index. A query is embedded and matched against pgvector. When online, an optional small language model runs **server-side** for two jobs: query understanding (turning a vague question into a good retrieval query) and cited synthesis (a short answer that quotes and links his actual content). Results always cite and link back to the source.
- **Offline mode (optional download):** the user downloads the same `bge-small` model plus a prebuilt copy of the index (~32 MB model + ~12 MB index, under 50 MB total, hosted on inexpensive object storage and fetched only on opt-in). The query is embedded on-device and searched against a local vector store. **Offline is pure retrieval** — no language model, no generation — which keeps it light and perfectly on-brand: it simply points the user to his own words with zero hallucination risk.
- **On-device runtime:** an Expo-compatible embedding runtime (e.g. react-native-executorch or ONNX Runtime RN); requires a dev build, not Expo Go.
- **On-device vector store:** op-sqlite with the sqlite-vec extension. At this corpus size, brute-force cosine search is single-digit milliseconds — no approximate-nearest-neighbor index needed.
- **Model weights are treated as data, not code,** by both app stores, so the downloadable-model pattern is store-compliant. A CI parity test asserts that server and on-device embeddings match, guarding against silent model/tokenizer drift.

## 9. Technical Stack

### App
- **React Native + Expo.** This is a content + audio/video + reading app; nothing in it demands platform-native code, and cross-platform halves the effort. Mature libraries already solve the hard media parts (background audio with lock-screen and CarPlay / Android Auto controls; video playback). The editorial look is fully achievable in RN.
- **Typography:** Flecha (editorial old-style serif) for display/headlines; IBM Plex Sans for UI and body. Both already in `design/fonts`.
- **Reader rendering:** a self-styled WebView for text layout/pagination, with a React Native Skia page-curl overlay (see §6).
- **Dev build required** (not Expo Go) due to the embedding runtime, Skia, and media modules.

### Local-first data model (the core principle)
- **The app is fully usable with no account and no network.** The notebook (highlights, notes, bookmarks, playback positions) and saved content are stored **locally on device** by default, with clear messaging that local-only data is lost if the device is lost.
- The on-device store is a single first-party SQLite database (`expo-sqlite`) holding both the notebook and saved content. It is designed so it can later "turn on" sync **without a data migration** — the same local tables become the synced tables once an account is added.

### Optional sync (the only thing that needs an account)
- **Supabase** as the backend (Postgres + Row Level Security), which also hosts the pgvector semantic-search index — one backend for both.
- A small custom last-write-wins sync layer between the local SQLite tables and Supabase Postgres — no third-party sync engine, chosen for stability (the only moving parts are SQLite, Postgres, and our own well-scoped sync module).
- **Conflict resolution: per-field last-write-wins** — full CRDTs are overkill for a single user across their own devices. Playback position uses most-recently-active-device-wins so progress never rewinds.

### Authentication (friction-free, minimal data)
- **No login wall.** An account is offered only when the user opts into cross-device sync (the Obsidian model).
- **Both Sign in with Apple and Google** are offered — Apple for iOS users, Google for Android users — with an optional magic-link email as a universal fallback. Offering Sign in with Apple alongside Google satisfies Apple's Guideline 4.8 requirement for a privacy-preserving equivalent; data is keyed on the opaque provider ID, and with Apple's Hide My Email the user's real email is never exposed to us.
- **In-app account deletion** is provided (Apple Guideline 5.1.1(v) requires it once account creation exists).

### Media & notifications
- Background-capable audio with lock-screen and CarPlay / Android Auto support; native video playback; offline downloads.
- Push notifications via Expo's notification service, with per-category opt-in.

## 10. Privacy Principles

- Local-first and fully functional with zero data collection.
- Sync collects the absolute minimum: an opaque identity key, and (with Sign in with Apple + Hide My Email) never a real email.
- In-app account deletion; a clear, linked privacy policy.

## 11. Scope: MVP vs. Later

**MVP (v1):** unified library (`all-resources`-backed), first-class audio player with offline + lock-screen/CarPlay, the Reader (WebView layout + Skia page-curl, Curl/Slide/Scroll, full typography controls), cross-content "Continue," offline-first saved content, the cross-media Notebook (local-only), the daily surface, and push notifications. Booklet handling per the §7 decision.

**v1.1 / v2:** opt-in cross-device sync; semantic search (online first, then the optional offline download); browse-by-Scripture and browse-by-speaker.
