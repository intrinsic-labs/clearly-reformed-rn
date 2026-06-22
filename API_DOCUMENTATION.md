# Clearly Reformed API Documentation

## Overview

The Clearly Reformed app pulls content from a WordPress REST API and an external podcast RSS feed. All endpoints are currently active and serving fresh content.

**Base URL**: `https://control.kdy.org/wp-json`

## Endpoints

### 1. Articles Endpoint

**Endpoint**: `/cr/v1/articles`

**Full URL**: `https://control.kdy.org/wp-json/cr/v1/articles`

**Method**: GET

**Query Parameters**:
- `per_page` (optional, default: varies) - Number of articles per request

**Example Request**:
```
GET https://control.kdy.org/wp-json/cr/v1/articles?per_page=10
```

**Response Format**: JSON array of article objects

**Response Shape**:
```json
[
  {
    "title": "string",
    "excerpt": "string",
    "featured_image_url": "string (URL)",
    "date": "string (format: 'MMMM d, yyyy')",
    "url": "string (URL to full article)",
    "mobile_featured_image": boolean,
    "has_booklet": boolean
  }
]
```

**Notes**:
- This is a simplified custom endpoint (`/cr/v1/` not standard WP REST)
- Date format is human-readable: `"May 12, 2026"`
- `has_booklet` indicates if a PDF companion document is available
- `mobile_featured_image` is a boolean flag for the mobile-specific image

---

### 2. Videos Endpoint

**Endpoint**: `/wp/v2/explainer-video`

**Full URL**: `https://control.kdy.org/wp-json/wp/v2/explainer-video`

**Method**: GET

**Query Parameters**:
- `per_page` (optional) - Number of videos per request
- `page` (optional) - Page number for pagination

**Example Request**:
```
GET https://control.kdy.org/wp-json/wp/v2/explainer-video?per_page=5&page=1
```

**Response Format**: JSON array of video post objects

**Response Shape**:
```json
[
  {
    "id": number,
    "title": { "rendered": "string" },
    "content": { "rendered": "string (HTML)" },
    "excerpt": { "rendered": "string (HTML)" },
    "date": "string (ISO8601)",
    "date_gmt": "string (ISO8601)",
    "slug": "string",
    "status": "publish",
    "type": "explainer-video",
    "link": "string (URL)",
    "featured_media": number (media ID),
    "video-series": [number, ...],
    "associated_people": [number, ...],
    "acf": {
      "source_url": "string",
      "audioFile": "string",
      "video_embed": "string (HTML embed code)",
      "display_date": "string or null",
      "poster_image": number (media ID),
      "hover_gif": number (media ID) or null,
      "video_background_color": "string (hex color)"
    }
  }
]
```

**Important Fields**:
- `date` is ISO8601 format (e.g., `"2026-06-18T18:04:06"`)
- `video-series` is an array of taxonomy term IDs
- `associated_people` is an array of person IDs
- `acf.poster_image` is a media ID (use `/wp/v2/media/{id}` to fetch URL)
- `acf.video_embed` contains embedded HTML (usually Apple Podcasts or YouTube embeds)

**Pagination Response Headers**:
- `X-WP-Total` - Total number of videos
- `X-WP-TotalPages` - Total pages available

---

### 3. Posts Endpoint

**Endpoint**: `/wp/v2/posts`

**Full URL**: `https://control.kdy.org/wp-json/wp/v2/posts`

**Method**: GET

**Query Parameters**:
- `per_page` (optional) - Number of posts per request
- `page` (optional) - Page number for pagination
- `slug` (optional) - Filter by post slug (returns array with matching post)

**Example Requests**:
```
# Get recent posts
GET https://control.kdy.org/wp-json/wp/v2/posts?per_page=10

# Get specific post by slug
GET https://control.kdy.org/wp-json/wp/v2/posts?slug=the-presbyterian-signers-of-the-declaration-of-independence
```

**Response Format**: JSON array of post objects

**Response Shape**:
```json
[
  {
    "id": number,
    "title": { "rendered": "string" },
    "content": { "rendered": "string (HTML)" },
    "excerpt": { "rendered": "string (HTML)" },
    "date": "string (ISO8601)",
    "date_gmt": "string (ISO8601)",
    "slug": "string",
    "status": "publish",
    "type": "post",
    "link": "string (URL)",
    "featured_image_url": "string (URL) or null",
    "featured_media": number (media ID),
    "better_featured_image": {
      "media_details": {
        "sizes": {
          "archive_large": { "source_url": "string" },
          "archive_small": { "source_url": "string" },
          "medium": { "source_url": "string" }
        }
      }
    } or null,
    "book_display": [string, ...] or null,
    "people_display": [string, ...] or null,
    "acf": {...}
  }
]
```

**Important Fields**:
- `better_featured_image.media_details.sizes` provides multiple image sizes
- `content.rendered` contains full HTML content
- When filtering by `slug`, the endpoint returns an array (may be empty if not found)

---

## Related Endpoints

### Get Media/Image Details

**Endpoint**: `/wp/v2/media/{id}`

**Full URL**: `https://control.kdy.org/wp-json/wp/v2/media/{id}`

**Example**:
```
GET https://control.kdy.org/wp-json/wp/v2/media/39874
```

**Response Shape**:
```json
{
  "id": number,
  "title": { "rendered": "string" },
  "source_url": "string (direct image URL)",
  "media_details": {
    "sizes": {...}
  }
}
```

**Use Case**: Videos reference `poster_image` IDs in their ACF fields; use this endpoint to fetch the actual image URL.

---

### Get Video Series Name

**Endpoint**: `/wp/v2/video-series/{id}`

**Full URL**: `https://control.kdy.org/wp-json/wp/v2/video-series/{id}`

**Example**:
```
GET https://control.kdy.org/wp-json/wp/v2/video-series/1438
```

**Response Shape**:
```json
{
  "id": number,
  "name": "string"
}
```

**Use Case**: Videos include a `video-series` array of IDs; use this endpoint to fetch human-readable series names.

---

## Podcast RSS Feed

**URL**: `https://media.rss.com/lbe/feed.xml`

**Method**: GET

**Response Format**: XML (RSS 2.0 with iTunes and Podcast Index namespaces)

**Feed Details**:
- **Podcast Title**: Life and Books and Everything
- **Host**: Kevin DeYoung
- **Total Episodes**: 194+ (regularly updated)
- **Update Frequency**: New episodes published roughly weekly

**Episode Item Structure**:
```xml
<item>
  <title>Episode Title</title>
  <description>HTML description</description>
  <enclosure url="https://content.rss.com/..." type="audio/mpeg" />
  <pubDate>Tue, 09 Jun 2026 12:27:12 GMT</pubDate>
  <itunes:duration>5096</itunes:duration>
  <itunes:episode>194</itunes:episode>
  <itunes:author>Clearly Reformed</itunes:author>
  <itunes:image href="image_url" />
</item>
```

**Key Fields**:
- `enclosure[@url]` - Direct download link for the MP3 (may redirect via CDN)
- `itunes:duration` - Episode length in seconds
- `itunes:episode` - Episode number
- `itunes:image[@href]` - Episode-specific or feed image URL
- `pubDate` - Publication date in RFC 2822 format

**Parsing Tips**:
- Audio URLs may return 307 redirects to Triton Digital CDN—follow them
- The `itunes:` namespace provides structured metadata
- All required fields (title, description, audio URL, duration, pub date) are present for every episode

---

## Common Patterns

### Fetching Full Article Content

The articles endpoint returns title and excerpt only. To get full content:

1. Get article from `/cr/v1/articles`
2. Extract the `url` field (e.g., `https://control.kdy.org/the-presbyterian-signers-of-the-declaration-of-independence/`)
3. Extract the slug from the URL (last path segment)
4. Query `/wp/v2/posts?slug={slug}` to get the full post with `content.rendered`

### Displaying Video Poster Images

1. Video response includes `acf.poster_image` (a media ID)
2. Call `/wp/v2/media/{acf.poster_image}` 
3. Use the `source_url` from the response

### Displaying Video Series Names

1. Video response includes `video-series` array of IDs
2. For each ID, call `/wp/v2/video-series/{id}`
3. Use the `name` field to display

---

## Request Headers

**Recommended**:
```
User-Agent: Mozilla/5.0
Accept: application/json
```

Most endpoints will work without explicit headers, but including `User-Agent` is best practice.

---

## Error Handling

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 404 | Resource not found (e.g., invalid slug, missing media ID) |
| 400 | Bad request (malformed query parameters) |
| 500 | Server error (rare; check endpoint status) |

**Common Issues**:
- **Empty array from `/wp/v2/posts?slug=...`**: The slug doesn't exist or is misspelled
- **Null featured image**: Some posts may not have featured images attached
- **Date parsing failures**: Articles use `"MMMM d, yyyy"` format; posts use ISO8601

---

## Data Freshness

As of June 19, 2026:
- **Articles**: Updated May 12, 2026
- **Videos**: Updated June 18, 2026
- **Posts**: Updated June 15, 2026
- **Podcast**: Updated June 18, 2026 (194 episodes available)

All endpoints are actively maintained.

---

## Addendum: Discovered Endpoints & Inventory (API probe, June 2026)

The three endpoints above were the originally-scoped set. A live probe of `https://control.kdy.org/wp-json` found a much richer surface. Highlights for app development:

### Unified feed (use this as the library backbone)

- **`kdy/v1/all-resources`** — a **pre-computed, unified, chronological feed of every content type**, with normalized `people_display`, featured images, dates, excerpts, and `videoEmbed`. One call instead of stitching per-type endpoints. This is the natural backbone for the home/library screen.

### Full content inventory (`wp/v2` custom post types)

Far beyond the three documented types. Approximate counts at probe time:

| Type | Count | Notes |
|------|-------|-------|
| `posts` | ~1,974 | Standard posts (acf: audioFile, video_embed, display_date) |
| `sermon` | ~1,018 | acf: scriptureReference, video, audioFile; `series` taxonomy |
| `podcast_episode` | ~310 | Individual episodes |
| `conference` / `coram-deo` | ~196 / 9 | Conference + Coram Deo content (video embeds, posters) |
| `lecture` | ~92 | Conference breakouts etc. |
| `podcast` | ~49 | Podcast series containers |
| `book` | ~36 | acf: audioFile, video_embed, source_url |
| `explainer-video` | ~9 | (already documented) |
| `event` | ~5 | acf: event_date_display, event_location, event_start_date, event_link |

### Taxonomies (browse/filter axes)

- **`associated_people`** (~814) — authors/speakers; resolve names for attribution and browse-by-speaker.
- **`series`** (~83) — sermon/teaching series.
- **`sermon_keywords`** (~40) — subject tags.
- **`bible_book`** — enables browse-by-Scripture.
- Plus `video-series`, `lecture-series`, `conference-series`, `book-category`.

### Search

- **`wp/v2/search?search={query}`** — keyword full-text across all post types; returns `id`, `title`, `url`, `type`. Supports `per_page` / `page`. This is the baseline keyword search; the app's *semantic* search (v2) is a separate hosted pipeline (Voyage embeddings + pgvector + Claude) built on top of the corpus, not this endpoint.

### Booklets (resolved)

- `has_booklet` (on `cr/v1/articles`) is **only a flag**. The designed booklets are hosted externally on **Publuu** (a flipbook viewer); the API exposes **no booklet PDF URL**.
- **Decision:** the app does **not** use Publuu. The booklet's text is the same as the article body (`content.rendered`, fetched via `wp/v2/posts?slug=`), which the in-app Reader renders natively. `has_booklet` is used only to show a "Booklet" badge.

### Transcripts

- A **`searchrovr-transcribe/v1`** namespace exists, implying a transcription service. Whether finished transcripts are retrievable is **unconfirmed**. This only gates whether **audio (podcasts/sermons)** is covered by semantic search — the plan is to launch search over text first and add audio as a fast-follow (self-generating transcripts via Whisper if needed).

### Other namespaces present

`yoast/v1` (SEO), `oembed/1.0`, plus standard `wp/v2/media/{id}` and `wp/v2/video-series/{id}` (already documented for resolving poster images and series names).
