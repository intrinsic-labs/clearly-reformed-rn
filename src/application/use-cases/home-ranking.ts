import type { ContentType, Resource } from '@/domain/resource';
import type { ResourceRef } from '@/domain/resource-ref';
import { resourceKey } from '@/domain/resource-ref';

/**
 * Pure ranking behind Home's personalised sections. No network, no storage — the
 * use case gathers the inputs and these functions decide.
 *
 * Design, from the UI call (2026-09): personalisation must be *lightly* weighted.
 * Most of Home is what everyone sees; a sprinkle is tuned to what the user has
 * saved and studied — never a tunnel into one topic. Vector similarity (v2) can
 * later replace `scoreAgainstTaste` without touching the callers.
 */

/** What the user has shown interest in: the content they saved, highlighted, or clipped. */
export interface TasteSignals {
  readonly refs: readonly ResourceRef[];
}

/** A per-type / per-person weight table derived from the signals. */
export interface TasteProfile {
  readonly types: ReadonlyMap<ContentType, number>;
  readonly people: ReadonlyMap<string, number>;
}

export function buildTasteProfile(signals: TasteSignals): TasteProfile {
  const types = new Map<ContentType, number>();
  const people = new Map<string, number>();
  for (const ref of signals.refs) {
    types.set(ref.type, (types.get(ref.type) ?? 0) + 1);
    const person = ref.subtitle.trim().toLowerCase();
    if (person) people.set(person, (people.get(person) ?? 0) + 1);
  }
  return { types, people };
}

/**
 * Rule 1 — "does the user know about the latest thing?": the newest pieces they
 * have not opened or saved, in feed order.
 */
export function pickNewForYou(feed: readonly Resource[], seenKeys: ReadonlySet<string>, limit: number): Resource[] {
  const out: Resource[] = [];
  for (const item of feed) {
    if (item.type === 'event') continue;
    if (seenKeys.has(resourceKey(item.type, item.id))) continue;
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

/** Score a candidate against the taste profile; higher is a better fit. */
export function scoreAgainstTaste(item: Resource, profile: TasteProfile, feedIndex: number): number {
  const typeWeight = profile.types.get(item.type) ?? 0;
  const person = (item.people[0] ?? '').trim().toLowerCase();
  const personWeight = person ? (profile.people.get(person) ?? 0) : 0;
  // Type affinity counts, but a matching speaker/author is the stronger tell.
  // A gentle recency bonus keeps the backfill from feeling like an archive dig.
  const recency = Math.max(0, 1 - feedIndex / 60);
  return typeWeight * 1 + personWeight * 2.5 + recency;
}

/**
 * Rule 2 — backfill: from a recent pool, the pieces closest to the user's taste
 * that they have not seen, with a diversity cap so one type can't take over.
 * Returns nothing when there are no signals — the section simply doesn't render.
 */
export function pickRecommendations(
  pool: readonly Resource[],
  signals: TasteSignals,
  seenKeys: ReadonlySet<string>,
  limit: number,
  maxPerType = 2,
): Resource[] {
  if (signals.refs.length === 0) return [];
  const profile = buildTasteProfile(signals);

  const scored = pool
    .map((item, index) => ({ item, score: scoreAgainstTaste(item, profile, index) }))
    .filter(({ item, score }) => {
      if (item.type === 'event') return false;
      if (seenKeys.has(resourceKey(item.type, item.id))) return false;
      // Only surface things with a real affinity, not just recency.
      return score >= 1.5;
    })
    .sort((a, b) => b.score - a.score);

  const out: Resource[] = [];
  const perType = new Map<ContentType, number>();
  for (const { item } of scored) {
    const count = perType.get(item.type) ?? 0;
    if (count >= maxPerType) continue;
    perType.set(item.type, count + 1);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}
