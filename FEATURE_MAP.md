---
feature-map: 1
root: .
revision: 6a4e003b69add9f373c4253dd7bf8308556c0e47
reconciled: 2026-10-29
---
# Clearly Reformed feature map

Every user-visible feature of the Clearly Reformed app (Expo + Expo Router, one tree for iOS and Android), each with its screen, how to reach it, a selector, its owning files and the data behind it. Look a report up here first ("the sleep timer doesn't stop playback" → `audio.sleep-timer`), then follow `Code:` and `Backend:`. To build, launch and drive the app, see [VERIFY.md](VERIFY.md).

**Maintenance rule.** Any change that adds, removes or moves a route, screen or feature updates its entry here in the same change, then re-runs the map check (the `feature-mapping` skill's `check_map.md`, run with `--routes 'src/app/**/*.tsx'`). Bump `revision:` only after re-reading every entry the check's drift warnings name; bump `reconciled:` only after walking every entry.

**Shared facts.**
- **No accounts, no sync.** Nothing signs in and nothing leaves the device except reads of public content. The personal layer (highlights, clips, notes, saved items, progress, downloads, cached bodies, FTS indexes) lives in one `expo-sqlite` database, `clearly-reformed.db`, created in `src/data/db/database.ts`. Reader and notification preferences live in `expo-sqlite/kv-store` (`reader.prefs.v1`, `notifications.prefs.v1`). See `account.sync`.
- **Content is public.** WordPress REST at `https://control.kdy.org/wp-json` (`src/data/api/http-client.ts`, GET only, no auth) and the podcast RSS at `https://media.rss.com/lbe/feed.xml`. Endpoint paths are in `src/data/api/endpoints.ts`. TanStack Query caches above the repositories; the composition root is `src/composition/container.ts`.
- **Platforms.** iOS and Android build from the same tree. Differences are noted per entry; the big ones are the tab bar (Liquid Glass with a separated Search tab on iOS 26, Material on Android), where the mini-player sits, and push animations (`src/app/_layout.tsx`).
- **Routes and deep links.** The scheme is `clearlyreformed://` (`app.json`). Expo Router maps files to paths: `/` (Home), `/library`, `/notebook`, `/search`, `/resource/<type>/<slug>`, `/player`, `/note-editor`, `/settings`. Write deep links with three slashes (`clearlyreformed:///settings`), and open them with `xcrun simctl openurl booted <url>` or `adb shell am start -a android.intent.action.VIEW -d <url>`. `<type>` is one of `article video podcast sermon sermon-clip lecture conference book event`.
- **Selectors.** All selectors are React Native `testID`s (XCUITest/Maestro `id:`, Android `resource-id`). Every selector marked `working` was confirmed in the rendered Maestro hierarchy (`maestro --device <id> hierarchy`) on both the iOS Simulator and the Android Emulator on 2026-10-29 unless the entry names a platform. Two platform gaps are known: the native tab items carry their testIDs only on iOS (on Android, tap the tab by its label), and the Library dropdown's options are invisible to iOS's accessibility tree because the menu's full-screen "Close menu" scrim swallows them (on iOS, tap by point or skip the menu with a deep link). A few IDs sit on states the walkthrough didn't reach. They are in the code on host elements but haven't yet been seen in a rendered tree: the error-state retries (`library-feed-retry`, `resource-detail-retry`), `resource-detail-external`, `search-results`, `library-filters-sort-option-*`, `reader-page-prev`/`next` (paged modes only), `reader-highlight-note`/`remove`/`cancel` (tap an existing highlight), `notebook-note-editor-tags-sheet` and `settings-downloads-remove-all` (needs a finished download). Whoever first exercises one confirms it here or fixes it. Repeated cards share one static ID (`resource-card`, `notebook-note-card`…), so select by index or by the card's text. Reader body text is inside a WebView and has no RN selector.

## Shell and navigation

### Tab bar
- **ID:** `shell.tabs`
- **Purpose:** Switches between the four top-level screens: Home, Library, Notebook and Search.
- **Where:** Bottom of every tab screen. On iOS 26 it's the native Liquid Glass bar, minimises on scroll down, with Search as the separate system search tab. On Android it's the Material bottom bar.
- **Reach:** Cold start lands on Home (`clearlyreformed:///`). The other tabs are `clearlyreformed:///library`, `clearlyreformed:///notebook` and `clearlyreformed:///search`.
- **Requires:** None.
- **Selector:** working on iOS — testID `shell-tabs-home`, `shell-tabs-library`, `shell-tabs-notebook`, `shell-tabs-search` (set as `tabBarItemTestID` through `unstable_nativeProps`; it lands on the native tab item). On Android the Material tab items don't carry it; select them by accessibility label `Home`, `Library`, `Notebook`, `Search` (Maestro `tapOn: "Library"`, which works on both platforms).
- **Code:** `src/app/(tabs)/_layout.tsx`, `src/presentation/lib/platform.ts`
- **Backend:** none — client-only
- **Status:** live
- **Notes:** `NativeTabs` comes from `expo-router/unstable-native-tabs`, and `unstable_nativeProps` is an unstable API, so re-check the tab testIDs after an expo-router upgrade. Tab screens pad their lists with `useTabScreenBottomInset` because the native bar doesn't inset content.

### App header and settings entry
- **ID:** `shell.header`
- **Purpose:** Shows the gold mark and the screen's wordmark, plus a person button that opens Settings.
- **Where:** Top of every tab screen (Home says "Clearly Reformed"; Library, Notebook and Search show their own names).
- **Reach:** Any tab, then the round person button at top right opens `/settings`.
- **Requires:** None.
- **Selector:** working — testID `shell-header` (bar), `shell-header-settings` (person button, label "Account and settings")
- **Code:** `src/presentation/components/chrome/app-header.tsx`
- **Backend:** none — client-only
- **Status:** live
- **Notes:** The button is labelled "Account and settings", but there is no account (see `account.sync`). It only opens Settings.

### Mini-player
- **ID:** `shell.mini-player`
- **Purpose:** Shows the current audio session's title and position, with play/pause and back 15s; tap it to open Now Playing.
- **Where:** iOS 26: inside the tab bar's bottom accessory capsule (narrow when the bar is minimised). Android and iOS before 26: a green pill floating just above the tab bar.
- **Reach:** Play anything (`audio.play`), or relaunch after listening: the last unfinished session is restored, paused (`audio.session-restore`). Only on the tab screens.
- **Requires:** An audio session; it renders nothing without one.
- **Selector:** working — testID `shell-mini-player` (opens `/player`); `shell-mini-player-toggle`, `shell-mini-player-skip-back` (both visible on iOS and Android even though nested in the pressable)
- **Code:** `src/presentation/components/chrome/mini-player.tsx`, `src/presentation/components/chrome/bottom-chrome.tsx`, `src/presentation/playback/use-now-playing.ts`, `src/presentation/playback/use-player.ts`
- **Backend:** track-player (`TrackPlayer.seekBy`, play/pause through `usePlayer().toggle`)
- **Status:** live
- **Notes:** The accessory is mounted only while something is loaded, because iOS draws the glass capsule for any mounted accessory. The inline variant hides the artwork and skip button.

### Deep links and the route stack
- **ID:** `shell.deep-links`
- **Purpose:** Opens any screen straight from a `clearlyreformed://` URL; detail screens push over the tabs and Now Playing opens as a sheet.
- **Where:** OS level; no UI of its own.
- **Reach:** `clearlyreformed:///resource/<type>/<slug>` (optional `?hl=<highlightId>` opens the Reader at a highlight, `?t=<seconds>` starts the inline video there), `clearlyreformed:///player`, `clearlyreformed:///note-editor`, `clearlyreformed:///settings`.
- **Requires:** A dev or release build carrying the scheme. Expo Go isn't supported (native deps).
- **Selector:** none — URL entry point with no element; check the destination screen's root testID instead.
- **Code:** `src/app/_layout.tsx`, `app.json`, `src/presentation/hooks/use-open-resource.ts`
- **Backend:** none — client-only
- **Status:** live
- **Notes:** `/player` with no audio session shows an empty gradient and goes back by itself after 1.2s. On Android, pushes use the platform's default fade-and-scale and the player slides up; on iOS, pushes slide from the right and the player is a real modal sheet. `predictiveBackGestureEnabled` is off on Android. There is no notification deep link: the daily reminder just opens the app.

## Home

### Today's pick
- **ID:** `home.daily-pick`
- **Purpose:** Features one piece from the recent catalogue, the same all day and different tomorrow.
- **Where:** Top of Home under the "Featured" eyebrow: a large card with a "Today's Pick" pill.
- **Reach:** Cold start (Home is the first tab). Tap the card to open it (`resource.detail` or `reader.open`).
- **Requires:** Network (the pool is the first 40 items of the feed). On failure the slot is just empty.
- **Selector:** working — testID `home-daily-pick` (screen root `home-screen`, scroll view `home-scroll`)
- **Code:** `src/app/(tabs)/index.tsx`, `src/presentation/components/content/featured-card.tsx`, `src/application/use-cases/daily.ts`, `src/presentation/hooks/queries/use-daily-pick.ts`
- **Backend:** `GET /wp-json/kdy/v1/all-resources?per_page=40&page=1` (`wordpress-resource-repository.ts#getFeed` → `mappers/resource-mapper.ts`). Events are dropped; the pick is an FNV-1a hash of the local date (`daily.ts#dailyIndex`).
- **Status:** live
- **Notes:** Unit test: `src/application/use-cases/daily.test.ts`.

### Continue
- **ID:** `home.continue`
- **Purpose:** A horizontal rail of things you started (read, listened, watched) with a progress bar; tap to resume.
- **Where:** Home, below Today's pick ("Continue"). Hidden when nothing is at least 1% in (`listContinue` filters `fraction >= 0.01`), so a just-opened article or a listen saved at 0:00 doesn't appear.
- **Reach:** Open an article and scroll, play audio, or play an inline video, then return to Home. A listen item starts playback and opens `/player`; read and watch items open the resource.
- **Requires:** Saved progress on this device.
- **Selector:** working — testID `home-continue` (rail), `continue-card` (each card). Confirmed on Android; on iOS the rail didn't render during the 2026-10-29 walkthrough because the only listen row was stored at position 0 (see Notes).
- **Code:** `src/app/(tabs)/index.tsx#onContinue`, `src/presentation/components/home/continue-card.tsx`, `src/presentation/hooks/queries/use-progress.ts`, `src/application/use-cases/progress.ts`, `src/data/db/sqlite-progress-repository.ts`
- **Backend:** SQLite `progress` (`listContinue`: not deleted, not completed, newest first, up to 8). Listen rows carry `playable_json`, so they resume without a network lookup.
- **Status:** live
- **Notes:** On the iOS Simulator (Debug, 2026-10-29) about 30s of playback, then pause and close, left the listen row at `position = 0.0` while the mini-player showed 0:32; on Android the same steps saved 148s. Not diagnosed; reported separately. Inspect the row with the read-only `sqlite3` command in VERIFY.md.

### New for you
- **ID:** `home.new-for-you`
- **Purpose:** The newest pieces you haven't opened or saved, with "See all" going to the Library.
- **Where:** Home, below Continue ("New for you"): a short list of resource rows.
- **Reach:** Cold start, then scroll Home. "See all" switches to the Library tab.
- **Requires:** Network. Hidden when everything recent has been seen.
- **Selector:** working — testID `home-new-for-you` (list), `resource-card` (rows), `home-new-for-you-see-all`
- **Code:** `src/application/use-cases/home.ts#getNewForYou`, `src/application/use-cases/home-ranking.ts`, `src/presentation/hooks/queries/use-home.ts`, `src/presentation/components/content/resource-card.tsx`
- **Backend:** `GET /wp-json/kdy/v1/all-resources?per_page=20&page=1`, filtered against SQLite `progress` (touched keys) and `saved_items`
- **Status:** live
- **Notes:** Today's pick is excluded. Ranking test: `src/application/use-cases/home-ranking.test.ts`.

### Explainer Series and Coram Deo rails
- **ID:** `home.series-rails`
- **Purpose:** Two horizontal rails of the latest explainer videos (dark band) and Coram Deo conference sessions.
- **Where:** Home, middle: "Explainer Series", then "Coram Deo".
- **Reach:** Cold start, then scroll Home. Tap a card to open it; tap the rail title to switch to the Library tab.
- **Requires:** Network. A rail with no items isn't rendered.
- **Selector:** working — testID `home-series-explainers`, `home-series-coram-deo` (rail sections), `series-card` (cards)
- **Code:** `src/presentation/components/home/series-rail.tsx`, `src/presentation/components/home/series-card.tsx`, `src/presentation/components/home/section-header.tsx`, `src/presentation/hooks/queries/use-resource-feed.ts`
- **Backend:** `GET /wp-json/wp/v2/explainer-video?per_page=20&page=1` and `GET /wp-json/wp/v2/conference?per_page=20&page=1` (first 8 of each)
- **Status:** live
- **Notes:** The rail title opens the Library on "All Resources", not filtered to videos or Coram Deo.

### Picked for you
- **ID:** `home.picked-for-you`
- **Purpose:** A light, taste-weighted list of recent pieces that resemble what you've saved and studied.
- **Where:** Home, below the series rails ("Picked for you").
- **Reach:** Save something or add a highlight, clip or note, then return to Home.
- **Requires:** Network, plus at least one saved item or notebook entry; otherwise hidden.
- **Selector:** working — testID `home-picked-for-you` (list), `resource-card` (rows)
- **Code:** `src/application/use-cases/home.ts#getRecommendations`, `src/application/use-cases/home-ranking.ts`, `src/presentation/hooks/queries/use-home.ts`
- **Backend:** `GET /wp-json/kdy/v1/all-resources?per_page=20&page=1` and `&page=2`, scored against SQLite `saved_items`, `highlights`, `clips` and `notes` (type and speaker affinity)
- **Status:** live

### Recently saved
- **ID:** `home.recently-saved`
- **Purpose:** A rail of your last eight saved items.
- **Where:** Bottom of Home ("Recently saved"). Tapping the header switches to the Notebook tab.
- **Reach:** Save something (`saved.toggle`), then return to Home.
- **Requires:** At least one saved item.
- **Selector:** working — testID `home-recently-saved` (rail), `saved-mini-card` (cards)
- **Code:** `src/presentation/components/home/saved-mini-card.tsx`, `src/presentation/hooks/queries/use-saved.ts`, `src/data/db/sqlite-saved-repository.ts`
- **Backend:** SQLite `saved_items` (not deleted, newest first)
- **Status:** live
- **Notes:** The header opens the Notebook on its last filter, not on "Saved".

## Library

### Library feed
- **ID:** `library.feed`
- **Purpose:** The whole catalogue, newest first, as an infinite list with pull-to-refresh.
- **Where:** Library tab: the "Library" heading, its two menus, then resource rows.
- **Reach:** Tap the Library tab (`clearlyreformed:///library`). Tap a row to open it.
- **Requires:** Network. No offline fallback: on failure it shows "Couldn't load the library." with "Try again".
- **Selector:** working — testID `library-feed` (FlatList), `resource-card` (rows), `library-feed-retry`; screen root `library-screen`
- **Code:** `src/app/(tabs)/library.tsx`, `src/presentation/components/content/resource-card.tsx`, `src/presentation/hooks/queries/use-resource-feed.ts`, `src/data/api/wordpress-resource-repository.ts`, `src/data/api/mappers/resource-mapper.ts`
- **Backend:** `GET /wp-json/kdy/v1/all-resources?per_page=20&page=N` (unfiltered) or `GET /wp-json/wp/v2/<type-path>?per_page=20&page=N[&order=asc]` (filtered, see `library.filters`); `X-WP-TotalPages` ends the scroll
- **Status:** live

### Library featured hero
- **ID:** `library.featured`
- **Purpose:** Lifts the newest piece into a large card above the list.
- **Where:** Top of the Library list, under "Featured".
- **Reach:** Library tab with filter "All Resources" and sort "Newest" (the defaults). Any other filter or sort hides it.
- **Requires:** Network.
- **Selector:** working — testID `library-featured`
- **Code:** `src/app/(tabs)/library.tsx`, `src/presentation/components/content/featured-card.tsx`
- **Backend:** first item of `GET /wp-json/kdy/v1/all-resources?per_page=20&page=1`
- **Status:** live

### Library type and sort menus
- **ID:** `library.filters`
- **Purpose:** Filters the catalogue to one content type and sorts it newest or oldest.
- **Where:** Right of the "Library" heading: a "Sort" pill and a type pill ("All Resources"), each opening a small dropdown.
- **Reach:** Library tab, then tap either pill. Types: All Resources, Articles, Videos, Podcast, Sermons, Lectures, Coram Deo, Books. "Oldest" is disabled ("Choose a type first") while "All Resources" is selected.
- **Requires:** Network.
- **Selector:** working — testID `library-filters-sort`, `library-filters-type` (triggers); options `library-filters-type-option-<value>` (`all`, `article`, `video`, `podcast`, `sermon`, `lecture`, `conference`, `book`) and `library-filters-sort-option-newest|oldest`, which are nested in the menu's scrim pressable and appear only in Android's tree. On iOS the whole open menu reads as one "Close menu" element, so options have no selector and no text match: tap by point (the menu is anchored under the pill and moves with scroll, so take a screenshot first) or open the resource by deep link instead.
- **Code:** `src/presentation/components/menu/dropdown-menu.tsx`, `src/presentation/components/content/library-filters.ts`, `src/app/(tabs)/library.tsx`, `src/data/api/endpoints.ts`
- **Backend:** switches the feed between `kdy/v1/all-resources` and `TYPE_PATH[type]`; `order=asc` only on type endpoints (the unified feed ignores `order`)
- **Status:** live
- **Notes:** Choosing "All Resources" resets the sort to Newest. Sermon clips and events aren't in the menu; they appear only in the unfiltered feed. The menu is a transparent RN `Modal`.

### Resource detail (media layout)
- **ID:** `resource.detail`
- **Purpose:** The page for anything that isn't long-form reading: title, byline, scripture reference, a play pill for audio, an inline video, a source link and the show notes or body.
- **Where:** Pushed full screen over the tabs, with a top bar (back, section label, bookmark) whose bottom edge is a scroll-progress line.
- **Reach:** Tap any card (Home, Library, Search, Notebook source rows), or `clearlyreformed:///resource/<type>/<slug>`. Articles and books with a body open the Reader instead (`reader.open`). By type: podcast, sermon, lecture, conference and book (no body) show a "Play …" pill when audio resolves; video shows the inline player (`resource.inline-video`); a non-YouTube video gets "Watch on the web ↗"; a cross-posted article without a body gets "Read at the source ↗"; sermon-clip and event show only the text.
- **Requires:** Network, or a saved item already cached on this device (`saved.offline-reading`). An unknown `<type>` fails to load.
- **Selector:** working — testID `resource-detail` (root), `resource-detail-back`, `resource-detail-save`, `resource-detail-play`, `resource-detail-external`, `resource-detail-retry`
- **Code:** `src/app/resource/#[type]/[slug].tsx`, `src/application/use-cases/content.ts#getDetail`, `src/data/api/wordpress-resource-content-repository.ts`, `src/data/api/mappers/resource-detail-mapper.ts`, `src/data/api/bible-books.ts`, `src/presentation/components/reader/article-body.tsx`, `src/presentation/hooks/queries/use-resource-content.ts`, `src/presentation/lib/html.ts`
- **Backend:** `GET /wp-json/wp/v2/<type-path>?slug=<slug>` (first item; `content.rendered` + `acf`), plus `GET /wp-json/wp/v2/bible_book?per_page=100&_fields=id,name` once per session to name the scripture book. A network failure falls back to SQLite `content_cache`.
- **Status:** live
- **Notes:** The play pill is hidden until `useResolvedTrack` resolves; podcasts need the RSS feed for that (`audio.play`). A leading YouTube embed is stripped from the body so the video doesn't appear twice.

### Inline video
- **ID:** `resource.inline-video`
- **Purpose:** Plays a YouTube-hosted video in place, resuming where you stopped and pausing any audio.
- **Where:** Resource detail, under the title block (16:9 frame).
- **Reach:** Library → type "Videos" → any row, or `clearlyreformed:///resource/video/<slug>`. A video clip from the Notebook opens with `?t=<seconds>`.
- **Requires:** Network (YouTube IFrame API).
- **Selector:** working — testID `resource-inline-video` (frame view); the player controls are inside the YouTube WebView and have no RN selector, so tap the frame's centre to play
- **Code:** `src/presentation/components/reader/inline-video.tsx`, `src/presentation/lib/video.ts`
- **Backend:** YouTube IFrame player (`react-native-youtube-iframe`). Watch position is written to SQLite `progress` (`kind = 'watch'`) every 5s while playing and on pause or end.
- **Status:** live
- **Notes:** Audio and video are mutually exclusive: playing the video calls `TrackPlayer.pause()`, and audio starting forces the video's `play` prop false. Videos embedded in Reader articles are a plain iframe inside the Reader WebView with no progress tracking (`reader.open`). Unit test: `src/presentation/lib/video.test.ts`.

## Search

### Keyword search
- **ID:** `search.keyword`
- **Purpose:** Searches titles and full text across the whole catalogue as you type.
- **Where:** Search tab: a field under the header, results below as resource rows.
- **Reach:** Tap the Search tab (`clearlyreformed:///search`); the field focuses itself. Type at least 2 characters; results follow a debounce.
- **Requires:** Network (offline, see `search.offline`).
- **Selector:** working — testID `search-input`, `search-results` (FlatList), `resource-card` (rows); screen root `search-screen`
- **Code:** `src/app/(tabs)/search.tsx`, `src/presentation/hooks/queries/use-search.ts`, `src/application/use-cases/search.ts`, `src/data/api/wordpress-search-repository.ts`
- **Backend:** `GET /wp-json/wp/v2/search?search=<term>&per_page=30` (`mapSearchResult`: type from `subtype`, slug from the URL's last segment)
- **Status:** live
- **Notes:** Empty states: "Search the whole library" (idle), "Nothing found", "Can't reach the library". Mapper test: `src/data/api/wordpress-search-repository.test.ts`. Semantic search (v2) isn't built.

### Offline search over saved content
- **ID:** `search.offline`
- **Purpose:** When the network search fails, searches the bodies of saved content cached on the device.
- **Where:** Search tab, same list, with the note "Offline — showing results from your saved content."
- **Reach:** Save and open a few articles (which caches them, see `saved.offline-reading`), turn on airplane mode, then search on the Search tab.
- **Requires:** Remote search failing, plus cached content.
- **Selector:** working — testID `search-offline-note`, `search-results`
- **Code:** `src/presentation/hooks/queries/use-search.ts#useOfflineSearchResults`, `src/data/db/sqlite-content-cache.ts#search`, `src/data/db/fts.ts`
- **Backend:** SQLite FTS5 `content_fts MATCH ?` (up to 30) joined to `content_cache`
- **Status:** live
- **Notes:** Unsaving never removes the cached body or its FTS row (`ContentCache.remove` has no caller), so unsaved items keep turning up offline. FTS query building is tested in `src/data/db/fts.test.ts`.

## Reader

### Reader
- **ID:** `reader.open`
- **Purpose:** Immersive, book-like reading for articles and books in our own WebView layout, with tap-to-hide chrome and a live progress line.
- **Where:** Full screen. Top bar: back, section label, "Aa", bookmark. Bottom bar: "N% read · M min left" (scroll) or "Page X of Y" with arrows (paged).
- **Reach:** Library → type "Articles" → any row, or `clearlyreformed:///resource/article/<slug>`. Books with a body open here too.
- **Requires:** Network, or a saved item cached on this device.
- **Selector:** working — testID `reader-screen` (root), `reader-webview` (the WebView host), `reader-back`, `reader-bottom-bar`; body text is none — inside WebView (tap at screen coordinates; a tap in the middle toggles the chrome)
- **Code:** `src/presentation/reader/reader-screen.tsx`, `src/presentation/reader/reader-webview.tsx`, `src/presentation/reader/reader-html.ts`, `src/presentation/reader/web/`, `src/presentation/lib/sanitize-html.ts`, `src/app/resource/#[type]/[slug].tsx`
- **Backend:** `GET /wp-json/wp/v2/posts?slug=<slug>` (or `wp/v2/book`), the same path as `resource.detail`; the HTML is sanitised and rendered locally
- **Status:** live
- **Notes:** Links in the body open in the system browser. A post with a YouTube URL gets an iframe above the body (`web/video.ts`); its origin must match the document base URL. The screen is blank for a frame or two until stored progress and highlights load. Generated-document golden test: `src/presentation/reader/reader-html.test.ts`.

### Page-turn modes (Scroll, Slide, Curl-lite)
- **ID:** `reader.modes`
- **Purpose:** Choose continuous scrolling or paged reading (CSS multicol); Curl is the slide engine with an edge shade.
- **Where:** Reader → "Aa" sheet → "Page turn" segmented control. In paged modes the bottom bar shows page arrows.
- **Reach:** Open the Reader, tap "Aa", tap Curl, Slide or Scroll. Swipe or use the arrows to turn pages.
- **Requires:** None. The default is Scroll.
- **Selector:** working — testID `reader-modes-curl`, `reader-modes-slide`, `reader-modes-scroll`, `reader-page-prev`, `reader-page-next`
- **Code:** `src/presentation/reader/settings-sheet.tsx`, `src/presentation/reader/prefs.ts`, `src/presentation/reader/web/runtime/layout.ts`, `src/presentation/reader/web/runtime/page-gestures.ts`, `src/presentation/reader/web/runtime/edge-dwell.ts`
- **Backend:** kv-store `reader.prefs.v1` (`mode`)
- **Status:** live
- **Notes:** The Skia page-curl shader in SPEC isn't built; Curl uses `curlShade` on the slide engine. Page swipes happen inside the WebView, so drive them with coordinate swipes or the arrow testIDs.

### Reader text settings sheet
- **ID:** `reader.settings`
- **Purpose:** Sets background (Paper, White, Sepia, Night), typeface (Flecha or Plex Sans), text size (5 steps), line spacing (3) and page turn; the open article restyles in place.
- **Where:** A bottom sheet over the Reader, titled "Text".
- **Reach:** Open the Reader, then tap "Aa" in the top bar. Close with ✕ or by tapping the scrim.
- **Requires:** None.
- **Selector:** working — testID `reader-settings-button` ("Aa"), `reader-settings-sheet`, `reader-settings-close`, `reader-settings-theme-paper|white|sepia|night`, `reader-settings-font-serif|sans`, `reader-settings-size-down`, `reader-settings-size-up`, `reader-settings-line-1|2|3`
- **Code:** `src/presentation/reader/settings-sheet.tsx`, `src/presentation/reader/prefs.ts`, `src/presentation/reader/themes.ts`, `src/presentation/reader/fonts-base64.ts`
- **Backend:** kv-store `reader.prefs.v1` (read synchronously at launch)
- **Status:** live
- **Notes:** The sheet is always mounted, slid offscreen, with `pointerEvents="none"` when closed, so `reader-settings-sheet` may be present in the tree while hidden; assert on visibility. Reader preferences live only here, not in `/settings`.

### Highlights
- **ID:** `reader.highlights`
- **Purpose:** Select text to highlight or copy it; tap an existing highlight to add a note or remove it.
- **Where:** In the Reader body. A dark pill appears above the bottom bar: "Highlight · Copy · Cancel" for a selection, "Add note / Edit note · Remove · Cancel" for a tapped highlight.
- **Reach:** Open the Reader. Scroll mode: long-press text and drag WebKit's handles. Paged modes: long-press to start the app-owned selection and drag its handles. Then tap Highlight.
- **Requires:** None.
- **Selector:** working — testID `reader-selection-highlight`, `reader-selection-copy`, `reader-selection-cancel`, `reader-highlight-note`, `reader-highlight-remove`, `reader-highlight-cancel`; the selection and highlight marks themselves are none — inside WebView (long-press by coordinates)
- **Code:** `src/presentation/reader/reader-screen.tsx#onHighlightPress`, `src/presentation/reader/web/runtime/highlights.ts`, `src/presentation/reader/web/runtime/paged-selection.ts`, `src/presentation/reader/web/runtime/scroll-selection.ts`, `src/presentation/reader/web/runtime/selection-handles.ts`, `src/presentation/reader/web/runtime/selection-paint.ts`, `src/presentation/reader/web/runtime/long-press.ts`, `src/presentation/hooks/queries/use-notebook.ts`, `src/data/db/sqlite-notebook-repository.ts`
- **Backend:** SQLite `highlights` (quote, prefix, suffix, `char_offset`) + `notebook_fts`; remove is a soft delete (`deleted = 1`); Copy uses `expo-clipboard`
- **Status:** live
- **Notes:** In paged mode WebKit selection is disabled and the app owns the whole selection lifecycle; on iOS the patched `react-native-webview` strips the system edit menu and tints the selection gold (see CLAUDE.md, Patched dependencies). Neither patch is reachable from Metro; changing them needs a native rebuild. On Android in Scroll mode the system selection toolbar (Copy · Share · Select all · Web search) appears above the selection alongside the app's pill; the menu-stripping patch is iOS-only. A long-press on a word (Maestro `longPressOn: point:`) selects it on both platforms, and `reader-selection-highlight` then saves it.

### Note on a highlight
- **ID:** `reader.highlight-note`
- **Purpose:** Attach a note to a highlight, edited in the note editor and shown on the highlight's Notebook card.
- **Where:** Reader → tap a highlight → "Add note" (or "Edit note") opens `/note-editor` titled "Note on highlight".
- **Reach:** Open the Reader, tap an existing highlight, then tap "Add note".
- **Requires:** An existing highlight.
- **Selector:** working — testID `reader-highlight-note`; the editor is `notebook.note-editor`
- **Code:** `src/presentation/reader/reader-screen.tsx`, `src/app/note-editor.tsx#persist`
- **Backend:** SQLite `highlights.note` (`setHighlightNote`) + `notebook_fts`
- **Status:** live
- **Notes:** In highlight mode the editor hides the title field and tags.

### Reading position and resume
- **ID:** `reader.progress`
- **Purpose:** Remembers where you stopped and reopens there, whatever typography or mode you've changed since; finished articles reopen at the top.
- **Where:** Reader progress line and bottom bar; the item also appears in Home → Continue.
- **Reach:** Open an article, scroll partway, go back, then reopen it. A Notebook highlight card opens at that highlight instead (`?hl=<id>`).
- **Requires:** None.
- **Selector:** none — position is inside the WebView; assert on the `reader-bottom-bar` text ("N% read" or "Page X of Y")
- **Code:** `src/presentation/reader/reader-screen.tsx#persist`, `src/presentation/reader/web/runtime/progress.ts`, `src/presentation/reader/web/runtime/offsets.ts`, `src/presentation/reader/web/runtime/initial-target.ts`, `src/application/use-cases/progress.ts`, `src/data/db/sqlite-progress-repository.ts`
- **Backend:** SQLite `progress` (`kind = 'read'`, `position` = character offset, `length` = total characters), written at most every 2s and on leaving
- **Status:** live

## Audio

### Play audio
- **ID:** `audio.play`
- **Purpose:** Plays a resource's audio (podcast episode, sermon, lecture, conference session, audiobook), resuming from saved progress and preferring a downloaded file.
- **Where:** Resource detail → green "Play episode / sermon / lecture / session / audiobook" pill; also Home → Continue on a listen item.
- **Reach:** Library → type "Podcast" → any row → the Play pill. Playback starts and `/player` opens.
- **Requires:** Network (stream, plus the RSS feed for podcasts), unless the item is downloaded.
- **Selector:** working — testID `resource-detail-play`, `continue-card`
- **Code:** `src/presentation/playback/use-player.ts`, `src/presentation/playback/player.ts#startTrack`, `src/application/use-cases/podcast.ts#resolveTrack`, `src/presentation/hooks/queries/use-resolved-track.ts`, `src/data/rss/lbe-podcast-repository.ts`, `src/application/use-cases/downloads.ts#resolvePlaybackUrl`
- **Backend:** Sermons, lectures and books use the detail's `acf` audio URL from `GET /wp-json/wp/v2/<type-path>?slug=`. Podcasts use `GET https://media.rss.com/lbe/feed.xml`, matched by episode number, then normalised title (`matchEpisode`). Then track-player `reset/add/play`, and SQLite `progress` (`kind = 'listen'`, `playable_json`).
- **Status:** live
- **Notes:** Resuming rewinds 3s for context. A podcast whose RSS item can't be matched shows no Play pill at all. That includes Kevin's guest appearances cross-posted as podcasts (e.g. "Church History for Everyone | Reformed Forum", which shows a YouTube embed and "Read at the source" instead), and these often sit at the top of the Podcast filter. For a reliable playable episode use a *Life and Books and Everything* one, e.g. `clearlyreformed:///resource/podcast/scroll-less-live-more-with-samuel-james` (episode 200). RSS parsing test: `src/data/rss/lbe-podcast-repository.test.ts`; matching test: `src/application/use-cases/podcast.test.ts`.

### Now Playing
- **ID:** `audio.now-playing`
- **Purpose:** The full player: artwork, title, seek bar with clip markers, back 15s, play/pause, forward 30s, save, share.
- **Where:** `/player`: a modal sheet on iOS, a slide-up screen on Android, dark sage.
- **Reach:** Tap the mini-player (`shell-mini-player`) or press Play on a resource. Deep link `clearlyreformed:///player` works only with a session loaded.
- **Requires:** An audio session.
- **Selector:** working — testID `audio-now-playing` (root), `audio-now-playing-toggle`, `audio-now-playing-skip-back`, `audio-now-playing-skip-forward`, `audio-now-playing-seek` (tap or drag by x-offset), `audio-now-playing-close`, `audio-now-playing-save`, `audio-now-playing-share`, `audio-now-playing-share-action`
- **Code:** `src/app/player.tsx`, `src/presentation/playback/use-now-playing.ts`, `src/presentation/playback/use-player.ts`, `src/presentation/playback/player.ts`
- **Backend:** track-player (`seekBy`, `seekTo`, play/pause); save → SQLite `saved_items`; share → the system share sheet with the title and `link`
- **Status:** live
- **Notes:** The heart is the same saved toggle as the bookmark (`saved.toggle`). Clip markers come from SQLite `clips` for this resource.

### Playback speed
- **ID:** `audio.speed`
- **Purpose:** Cycles playback speed 1× → 1.25× → 1.5× → 1.75× → 2×.
- **Where:** Now Playing, left of the transport row (label like "1×").
- **Reach:** Open Now Playing, tap the speed label.
- **Requires:** An audio session.
- **Selector:** working — testID `audio-speed`
- **Code:** `src/presentation/playback/player.ts#cyclePlaybackRate`, `src/app/player.tsx`, `src/presentation/lib/format.ts#formatRate`
- **Backend:** track-player `getRate` / `setRate`; not persisted
- **Status:** live
- **Notes:** The rate isn't saved, so after a cold launch the next track plays at the player's default.

### Sleep timer
- **ID:** `audio.sleep-timer`
- **Purpose:** Cycles off → 15 → 30 → 45 → 60 minutes; when it fires, playback fades out over 5s.
- **Where:** Now Playing, right of the transport row (moon icon; gold with "Nm" while set).
- **Reach:** Open Now Playing, tap the moon.
- **Requires:** An audio session.
- **Selector:** working — testID `audio-sleep-timer`
- **Code:** `src/presentation/playback/sleep-timer.ts`, `src/app/player.tsx`
- **Backend:** none — client-only (JS timers, then track-player `fadeOutPause(5000)`)
- **Status:** live
- **Notes:** The timer lives in JS memory. It's lost if the process is killed, and its timers may be throttled while the JS runtime is backgrounded.

### Downloads
- **ID:** `audio.downloads`
- **Purpose:** Downloads the current episode for offline listening, shows progress, and removes it after a confirmation.
- **Where:** Now Playing → actions panel → "Download" (shows a percentage, then "Downloaded"). Totals and "Remove all" are in Settings (`settings.downloads`).
- **Reach:** Play something, open Now Playing, tap Download. Tap again when downloaded to get "Remove download?".
- **Requires:** Network to download.
- **Selector:** working — testID `audio-downloads`
- **Code:** `src/data/files/file-downloads-repository.ts`, `src/application/use-cases/downloads.ts`, `src/presentation/hooks/queries/use-downloads.ts`, `src/app/player.tsx#onDownload`
- **Backend:** `GET <audio URL>` via the `expo-file-system` download task into `Documents/audio/<key>.mp3`; SQLite `downloads` (`status`: downloading, done or failed)
- **Status:** live
- **Notes:** Playback and the cold-launch restore prefer the local file (`resolvePlaybackUrl`). A failed download deletes the partial file and alerts "Download failed".

### Clip a moment
- **ID:** `audio.clip-moment`
- **Purpose:** Saves the current playback second as a clip in the Notebook.
- **Where:** Now Playing → actions panel → "Clip moment" (turns into "Saved m:ss" for 2.5s); a dot appears on the seek bar.
- **Reach:** Open Now Playing, tap "Clip moment".
- **Requires:** An audio session.
- **Selector:** working — testID `audio-clip-moment`
- **Code:** `src/app/player.tsx#onClipMoment`, `src/presentation/hooks/queries/use-notebook.ts`, `src/data/db/sqlite-notebook-repository.ts#addClip`
- **Backend:** SQLite `clips` (`media_kind = 'audio'`, `start_sec`, `end_sec` null) + `notebook_fts`
- **Status:** live
- **Notes:** Clips can only be made here. Nothing creates video clips, though `ClipCard` can render them (`mediaKind = 'video'`).

### Transcript
- **ID:** `audio.transcript`
- **Purpose:** A "Transcript" action, shown but not functional.
- **Where:** Now Playing → actions panel, second item, dimmed.
- **Reach:** Open Now Playing.
- **Requires:** An audio session.
- **Selector:** working — testID `audio-transcript` (a plain View, no press handler)
- **Code:** `src/app/player.tsx`
- **Backend:** none — client-only
- **Status:** placeholder — no transcript source yet (audio transcripts are gated on `searchrovr-transcribe`, per CLAUDE.md).

### Background and lock-screen playback
- **ID:** `audio.background`
- **Purpose:** Audio keeps playing in the background, with play, pause, seek and ±15/30s jumps from the lock screen, Control Center, notification shade or headphones.
- **Where:** System media controls, outside the app.
- **Reach:** Start playback, then lock the device or background the app.
- **Requires:** A device or simulator with system media UI. iOS needs `UIBackgroundModes: audio` (`app.json`).
- **Selector:** none — system UI, outside the app's tree
- **Code:** `src/data/playback/playback-service.ts`, `./index.js`, `src/presentation/playback/player.ts#setup`
- **Backend:** track-player remote events (`RemotePlay`, `RemotePause`, `RemoteStop`, `RemoteSeek`, `RemoteJumpForward`, `RemoteJumpBackward`, `RemoteDuck`)
- **Status:** live
- **Notes:** Android keeps playing after the app is swiped away (`AppKilledPlaybackBehavior.ContinuePlayback`). CarPlay and Android Auto aren't configured (no entitlement or templates). The track-player fork is patched (see CLAUDE.md).

### Session restore and progress persistence
- **ID:** `audio.session-restore`
- **Purpose:** Saves listening position while playing, and on relaunch restores the last unfinished session, paused, so the mini-player offers to continue.
- **Where:** Invisible; it shows up as the mini-player after a cold start and as Home → Continue items.
- **Reach:** Play something for a while, kill the app, relaunch.
- **Requires:** A prior unfinished listen.
- **Selector:** working — testID `shell-mini-player` (present after relaunch)
- **Code:** `src/presentation/playback/playback-bootstrap.tsx`, `src/presentation/playback/player.ts#restoreTrack`, `src/data/db/sqlite-progress-repository.ts#latestListen`
- **Backend:** SQLite `progress` (`kind = 'listen'`), written about every 5s while playing and on pause, end or track change; track-player `add` + `seekTo`
- **Status:** live

## Notebook

### Notebook feed
- **ID:** `notebook.feed`
- **Purpose:** One feed of your highlights, clips, notes and saved items, newest first, with counts.
- **Where:** Notebook tab: a counts line ("N highlights · N clips · N notes"), a search button, filter chips, then cards.
- **Reach:** Tap the Notebook tab (`clearlyreformed:///notebook`).
- **Requires:** None (all local). With nothing saved it shows "Your study layer".
- **Selector:** working — testID `notebook-screen` (root), `notebook-feed` (FlatList), `notebook-highlight-card`, `notebook-clip-card`, `notebook-note-card`, `notebook-saved-card`
- **Code:** `src/app/(tabs)/notebook.tsx`, `src/presentation/components/notebook/card-shell.tsx`, `src/presentation/components/notebook/highlight-card.tsx`, `src/presentation/components/notebook/clip-card.tsx`, `src/presentation/components/notebook/note-card.tsx`, `src/presentation/components/notebook/saved-card.tsx`, `src/presentation/components/notebook/source-row.tsx`, `src/presentation/components/markdown-view.tsx`, `src/application/use-cases/notebook.ts`, `src/data/db/sqlite-notebook-repository.ts`
- **Backend:** SQLite `highlights`, `clips`, `notes` (not deleted) and `saved_items`, merged by time in the screen
- **Status:** live
- **Notes:** Tapping a highlight card opens the Reader at that highlight (`?hl=`). Tapping a note card opens the editor. An audio clip card plays the clip (`notebook.clip-playback`); a video clip opens the video at `?t=`. A card's source row and inner buttons are nested pressables, so on iOS only the card's own ID is visible.

### Notebook filters
- **ID:** `notebook.filters`
- **Purpose:** Narrows the feed to All, Highlights, Clips, Notes or Saved.
- **Where:** Notebook, a chip row under the counts line (replaced by the search field while search is open).
- **Reach:** Notebook tab, then tap a chip.
- **Requires:** None.
- **Selector:** working — testID `notebook-filters-all`, `notebook-filters-highlights`, `notebook-filters-clips`, `notebook-filters-notes`, `notebook-filters-saved`
- **Code:** `src/app/(tabs)/notebook.tsx`, `src/presentation/hooks/queries/use-notebook.ts`, `src/presentation/hooks/queries/use-saved.ts`
- **Backend:** SQLite `highlights` / `clips` / `notes` per filter; `saved_items` for Saved
- **Status:** live
- **Notes:** The selected chip reports `accessibilityState.selected`.

### Notebook search
- **ID:** `notebook.search`
- **Purpose:** Full-text search over your highlight quotes and notes, clip captions and note bodies, offline.
- **Where:** Notebook → magnifier at the right of the counts line opens a search field in place of the chips; ✕ closes it.
- **Reach:** Notebook tab, tap the magnifier, type at least 2 characters.
- **Requires:** Notebook entries.
- **Selector:** working — testID `notebook-search-toggle`, `notebook-search-input`
- **Code:** `src/app/(tabs)/notebook.tsx`, `src/presentation/hooks/queries/use-notebook.ts#useNotebookSearch`, `src/data/db/sqlite-notebook-repository.ts#search`, `src/data/db/fts.ts`
- **Backend:** SQLite FTS5 `notebook_fts MATCH ?` (up to 50) joined back to `highlights` / `clips` / `notes`
- **Status:** live
- **Notes:** Saved items aren't indexed in `notebook_fts`, so the search never returns them.

### Clip playback
- **ID:** `notebook.clip-playback`
- **Purpose:** Plays an audio clip from its moment and opens Now Playing.
- **Where:** Notebook → a clip card (the card itself or its "play at m:ss" chip).
- **Reach:** Clip a moment (`audio.clip-moment`), then Notebook → filter "Clips" → tap the card.
- **Requires:** Network to resolve the source (detail, plus RSS for podcasts) unless it's cached and downloaded.
- **Selector:** working — testID `notebook-clip-card`
- **Code:** `src/presentation/playback/use-play-clip.ts`, `src/presentation/components/notebook/clip-card.tsx`, `src/app/(tabs)/notebook.tsx`
- **Backend:** `GET /wp-json/wp/v2/<type-path>?slug=` (`content.getDetail`) → `podcast.resolveTrack` (RSS) → track-player `play` + `seekTo(start_sec)`
- **Status:** live
- **Notes:** It fails silently (returns false, no alert) when the source can't be resolved.

### Swipe to delete
- **ID:** `notebook.swipe-delete`
- **Purpose:** Swipe a card left to reveal Delete (or Remove for saved items), then confirm in a native alert.
- **Where:** Any Notebook card; a red action appears at the right edge.
- **Reach:** Notebook tab, swipe a card left, tap the red action, confirm "Are you sure?".
- **Requires:** At least one card.
- **Selector:** working — testID `notebook-swipe-delete` (the revealed action; it exists only once a row is swiped open)
- **Code:** `src/presentation/components/notebook/swipe-to-delete.tsx`, `src/app/(tabs)/notebook.tsx#deleteEntry`
- **Backend:** soft delete: `UPDATE highlights|clips|notes SET deleted = 1` + `DELETE FROM notebook_fts`; saved items → `saved_items.deleted = 1` (`saved.toggle`)
- **Status:** live
- **Notes:** While a row is open or mid-swipe, taps on the card are swallowed (they close the row). The comment in `notebook.tsx` still says "Long-press any card to delete it"; that is stale.

### Add menu: blank note and export
- **ID:** `notebook.export`
- **Purpose:** The gold + button opens a menu with "Blank note" (opens the editor) and "Export notebook" (shares everything as Markdown).
- **Where:** Notebook, a floating gold button at bottom right above the tab bar; the menu pops up above it over a scrim.
- **Reach:** Notebook tab, tap +, then choose an item.
- **Requires:** For export, at least one entry or saved item (otherwise nothing happens).
- **Selector:** working — testID `notebook-fab`, `notebook-fab-scrim`; `notebook-export`, `notebook-new-note` (nested in the scrim pressable, but visible on both platforms)
- **Code:** `src/app/(tabs)/notebook.tsx#onExport`, `src/presentation/lib/notebook-export.ts`
- **Backend:** SQLite reads of all notebook tables + `saved_items` → system share sheet (`Share.share`) with Markdown text
- **Status:** live

### Note editor
- **ID:** `notebook.note-editor`
- **Purpose:** A rich-text note (headings, bold, italic, lists) with an optional title and tags, autosaved as you type.
- **Where:** `/note-editor`, pushed over the tabs. Header: back, "Note", tag button, pencil/check. The formatting toolbar sits above the keyboard while editing; tags open in a bottom sheet.
- **Reach:** Notebook → + → "Blank note" (opens with the keyboard up), or tap a note card. Deep link `clearlyreformed:///note-editor` opens a new note.
- **Requires:** None.
- **Selector:** working — testID `notebook-note-editor` (root), `notebook-note-editor-title`, `notebook-note-editor-input` (native `EnrichedMarkdownTextInput`), `notebook-note-editor-save` (pencil to edit, check when done), `notebook-note-editor-back`, `notebook-note-editor-tags`, `notebook-note-editor-tags-sheet`, `notebook-note-editor-toolbar`
- **Code:** `src/app/note-editor.tsx`, `src/presentation/components/notebook/format-toolbar.tsx`, `src/presentation/hooks/use-keyboard-bottom-inset.ts`, `src/presentation/lib/markdown.ts`, `src/presentation/hooks/queries/use-notebook.ts`
- **Backend:** SQLite `notes` (`title`, `body` as Markdown, `tags_json`) + `notebook_fts`; insert on the first save, update after; autosave 1s after the last change, again on Done and on back
- **Status:** live
- **Notes:** The editor is the patched `react-native-enriched-markdown`: without the patch, iOS silently falls back to San Francisco (see CLAUDE.md). Markdown is storage only and is never shown. iOS shrinks the editor by the keyboard inset; Android relies on adjustResize. Markdown tests: `src/presentation/lib/markdown.test.ts`.

## Saved and bookmarks

### Save and unsave
- **ID:** `saved.toggle`
- **Purpose:** Bookmark any resource so it lands in Notebook → Saved and Home → Recently saved; tap again to remove it.
- **Where:** Bookmark at top right of the resource detail and the Reader; the heart beside the title on Now Playing. Filled gold when saved.
- **Reach:** Open any resource, tap the bookmark.
- **Requires:** None.
- **Selector:** working — testID `resource-detail-save`, `reader-save`, `audio-now-playing-save`
- **Code:** `src/application/use-cases/saved.ts`, `src/presentation/hooks/queries/use-saved.ts`, `src/data/db/sqlite-saved-repository.ts`
- **Backend:** SQLite `saved_items` (upsert; unsave is a soft delete, `deleted = 1`)
- **Status:** live
- **Notes:** Accessibility labels are "Save" and "Remove from saved". Saving feeds Home's "Picked for you" and removes the item from "New for you".

### Offline copies of saved content
- **ID:** `saved.offline-reading`
- **Purpose:** Saved articles and resources stay readable, and searchable, with no connection.
- **Where:** Invisible; it's the fallback behind the resource detail and the Reader.
- **Reach:** Save a resource, open it again online (that's when the body is cached), go offline, open it.
- **Requires:** The item saved and opened at least once after saving.
- **Selector:** none — no element of its own; check `reader-screen` or `resource-detail` loads offline
- **Code:** `src/application/use-cases/content.ts#getDetail`, `src/data/db/sqlite-content-cache.ts`, `src/application/ports/content-cache.ts`
- **Backend:** SQLite `content_cache` (`detail_json`) + `content_fts`; written after a successful fetch when the item is saved, read when the fetch fails
- **Status:** live
- **Notes:** Saving doesn't cache by itself: the body is cached on the next fetch while saved (or a React Query refetch of the open screen). Save and go offline immediately, and there's no offline copy. Unsaving doesn't evict the cache.

## Settings

### Daily pick reminder
- **ID:** `settings.daily-reminder`
- **Purpose:** A repeating local notification at 8:00 each morning ("Today's pick is ready").
- **Where:** Settings → Notifications → "Daily pick reminder" switch.
- **Reach:** Any tab → person button (`shell-header-settings`), or `clearlyreformed:///settings`.
- **Requires:** Notification permission (asked on first enable; if denied, an alert explains). Android creates a "daily" channel.
- **Selector:** working — testID `settings-daily-reminder` (Switch); screen root `settings-screen`, back `settings-back`
- **Code:** `src/app/settings.tsx`, `src/presentation/notifications/notification-prefs.ts`
- **Backend:** `expo-notifications` daily trigger (id `daily-pick-reminder`); kv-store `notifications.prefs.v1`
- **Status:** live
- **Notes:** The notification carries no data and there's no response handler, so tapping it just opens the app wherever it was. Off by default.

### New-content alert preferences
- **ID:** `settings.content-alerts`
- **Purpose:** Per-category switches for new articles, episodes, videos and conference updates.
- **Where:** Settings → Notifications, the second group, with the footnote "take effect when publishing notifications launch".
- **Reach:** `clearlyreformed:///settings`.
- **Requires:** Notification permission to turn one on.
- **Selector:** working — testID `settings-content-alerts-newArticles`, `settings-content-alerts-newEpisodes`, `settings-content-alerts-newVideos`, `settings-content-alerts-conferenceUpdates`
- **Code:** `src/app/settings.tsx`, `src/presentation/notifications/notification-prefs.ts`
- **Backend:** kv-store `notifications.prefs.v1` only; no push token is registered and nothing is sent
- **Status:** placeholder — the choices persist, but push delivery (server ingestion + Expo Push) isn't built.

### Downloads storage
- **ID:** `settings.downloads`
- **Purpose:** Shows how many episodes are downloaded and their size, and removes them all.
- **Where:** Settings → Downloads → "Downloaded audio", with "Remove all" when there's anything to remove.
- **Reach:** `clearlyreformed:///settings`; "Remove all" asks for confirmation.
- **Requires:** At least one download for "Remove all" to appear.
- **Selector:** working — testID `settings-downloads-remove-all`
- **Code:** `src/app/settings.tsx#onClearDownloads`, `src/presentation/hooks/queries/use-downloads.ts`, `src/data/files/file-downloads-repository.ts`
- **Backend:** SQLite `downloads` + files under `Documents/audio/` (deleted per record)
- **Status:** live
- **Notes:** The size sums `bytes_total` over every record, including failed ones.

### About
- **ID:** `settings.about`
- **Purpose:** A link to clearlyreformed.org and the version line ("0.1.0 — local-first…").
- **Where:** Settings → About.
- **Reach:** `clearlyreformed:///settings`, then scroll to the bottom.
- **Requires:** A browser for the link.
- **Selector:** working — testID `settings-about-site`
- **Code:** `src/app/settings.tsx`
- **Backend:** none — client-only (`Linking.openURL('https://clearlyreformed.org')`)
- **Status:** live
- **Notes:** The version is hard-coded as "0.1.0"; `app.json` says `0.1` (build 9). Settings has no reader preferences (`reader.settings`) and no data-reset action.

## Account and sync

### Account, sign-in and sync
- **ID:** `account.sync`
- **Purpose:** Planned opt-in Sign in with Apple or Google and last-write-wins sync to Supabase (v1.1); nothing of it is in the app.
- **Where:** Nowhere. The header's "Account and settings" button opens Settings, which has no account section.
- **Reach:** Not reachable.
- **Requires:** n/a
- **Selector:** none — no UI exists
- **Code:** `src/data/db/database.ts`, `src/app/settings.tsx`
- **Backend:** none. No Supabase client, auth library or sync code: `grep -ri supabase src` and the `package.json` dependencies come up empty. The only groundwork is the schema: synced tables carry `pending`, `deleted` and `updated_at` (`database.ts`), and soft deletes keep tombstones for a future push.
- **Status:** unavailable — not built; deferred to v1.1 by design (CLAUDE.md, `project-info.md` §11). Settings says "nothing you do here leaves this device".

## Coverage
- `src/app/_layout.tsx` — root stack, fonts and splash gating, providers; referenced from `shell.deep-links`, listed here for clarity
- `src/app/(tabs)/_layout.tsx` — tab navigator; owned by `shell.tabs`
- `src/presentation/providers/app-providers.tsx` — QueryClient and DI context, no feature of its own
- `src/presentation/providers/use-cases-context.tsx` — DI hook
- `src/composition/container.ts` — composition root, wires every repository listed in the entries
- `src/presentation/hooks/use-app-fonts.ts` — font loading behind the splash screen
- `src/presentation/hooks/queries/use-podcast-episodes.ts` — `usePodcastEpisodes` has no caller (dead code); episodes are fetched only through `resolveTrack`
- `src/presentation/components/icons.tsx` — shared SVG icons
- `src/presentation/theme/index.ts` — palette and type tokens
- `GET /wp-json/wp/v2/event` and `GET /wp-json/wp/v2/sermon-clip` (list form) — in `TYPE_PATH` but not offered as Library filters; only the single-item (slug) form is used, through `resource.detail`
- `GET /wp-json/wp/v2/posts`, `/wp/v2/podcast_episode`, `/wp/v2/sermon`, `/wp/v2/lecture`, `/wp/v2/book` (list form) — used by `library.filters`; `/wp/v2/explainer-video` and `/wp/v2/conference` also by `home.series-rails`
- `GET https://media.rss.com/lbe/feed.xml` — referenced by `audio.play`; `parseLbeFeed` is also exercised by its unit test
