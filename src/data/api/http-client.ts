/**
 * Thin typed `fetch` wrapper for the WordPress REST API (per SPEC §2 — no axios/ky).
 * Knows the base URL, default headers, error mapping, and WP pagination headers.
 */

export const API_BASE_URL = 'https://control.kdy.org/wp-json';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
  }
}

/** A list response plus the WordPress pagination headers (`X-WP-Total*`). */
export interface ListResponse<T> {
  readonly data: T;
  readonly totalItems: number;
  readonly totalPages: number;
}

type QueryValue = string | number | undefined;

function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

const DEFAULT_HEADERS = {
  Accept: 'application/json',
} as const;

/** GET a JSON list endpoint, returning the parsed body plus pagination totals. */
export async function getList<T>(path: string, params?: Record<string, QueryValue>): Promise<ListResponse<T>> {
  const url = buildUrl(path, params);
  const response = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new HttpError(response.status, url);

  const data = (await response.json()) as T;
  const totalItems = Number(response.headers.get('X-WP-Total') ?? 0);
  const totalPages = Number(response.headers.get('X-WP-TotalPages') ?? 0);
  return { data, totalItems, totalPages };
}
