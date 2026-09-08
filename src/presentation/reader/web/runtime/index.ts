import { API } from '@/presentation/reader/web/runtime/api';
import { EDGE_DWELL } from '@/presentation/reader/web/runtime/edge-dwell';
import { HIGHLIGHTS } from '@/presentation/reader/web/runtime/highlights';
import { INITIAL_TARGET } from '@/presentation/reader/web/runtime/initial-target';
import { LAYOUT } from '@/presentation/reader/web/runtime/layout';
import { LONG_PRESS } from '@/presentation/reader/web/runtime/long-press';
import { OFFSETS } from '@/presentation/reader/web/runtime/offsets';
import { PAGE_GESTURES } from '@/presentation/reader/web/runtime/page-gestures';
import { PAGED_SELECTION } from '@/presentation/reader/web/runtime/paged-selection';
import { PROGRESS } from '@/presentation/reader/web/runtime/progress';
import { scopeScript } from '@/presentation/reader/web/runtime/scope';
import { SCROLL_SELECTION } from '@/presentation/reader/web/runtime/scroll-selection';
import { SELECTION_HANDLES } from '@/presentation/reader/web/runtime/selection-handles';
import { SELECTION_PAINT } from '@/presentation/reader/web/runtime/selection-paint';
import { TAPS } from '@/presentation/reader/web/runtime/taps';
import type { ReaderWebPrefs } from '@/presentation/reader/web/types';

/**
 * The Reader's browser-side runtime, assembled as ONE script in ONE IIFE scope.
 *
 * The chunks are plain-string fragments of a single function body: they share
 * variables by closure (`state`, `paged`, `pagedSel`, `drag`, ...) exactly as the
 * original monolithic script did, and several reference functions declared in a
 * later chunk (function declarations hoist; `var`s are read only after init). The
 * ORDER below is therefore part of the behaviour -- keep it.
 */
export function runtimeScript(initial: Pick<ReaderWebPrefs, 'paged' | 'curlShade'>): string {
  const chunks = [
    scopeScript(initial),
    OFFSETS,
    PROGRESS,
    LAYOUT,
    INITIAL_TARGET,
    PAGE_GESTURES,
    TAPS,
    PAGED_SELECTION,
    EDGE_DWELL,
    LONG_PRESS,
    SELECTION_PAINT,
    SELECTION_HANDLES,
    SCROLL_SELECTION,
    HIGHLIGHTS,
    API,
  ];
  return `(function () {
  'use strict';
${chunks.join('\n\n')}
})();`;
}
