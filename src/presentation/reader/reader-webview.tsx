import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { HighlightEntry } from '@/domain/notebook';
import {
  buildReaderHtml,
  type ReaderHeaderInfo,
  type ReaderInsets,
  type ReaderWebPrefs,
} from '@/presentation/reader/reader-html';

/** Messages the page posts to RN. */
export interface ReaderSelection {
  readonly text: string;
  readonly prefix: string | null;
  readonly suffix: string | null;
  readonly charOffset: number | null;
}

export interface ReaderProgressEvent {
  readonly fraction: number;
  readonly charOffset: number;
  readonly page: number;
  readonly pageCount: number;
}

export interface ReaderWebViewHandle {
  applyPrefs(prefs: ReaderWebPrefs): void;
  applyHighlightToSelection(id: string): void;
  paintHighlights(highlights: readonly HighlightEntry[]): void;
  removeHighlight(id: string): void;
  clearSelection(): void;
  goPage(delta: 1 | -1): void;
}

interface Props {
  readonly bodyHtml: string;
  readonly header: ReaderHeaderInfo;
  readonly insets: ReaderInsets;
  readonly initialPrefs: ReaderWebPrefs;
  /** Restore position (character offset) and existing highlights, sent at page-ready. */
  readonly initialCharOffset: number;
  readonly initialHighlights: readonly HighlightEntry[];
  /** Open scrolled to this highlight's mark (wins over the character offset). */
  readonly targetHighlightId?: string;
  readonly onProgress: (event: ReaderProgressEvent) => void;
  readonly onLayout: (info: { totalChars: number; pageCount: number }) => void;
  readonly onTap: () => void;
  readonly onLink: (href: string) => void;
  readonly onSelection: (selection: ReaderSelection | null) => void;
  readonly onHighlightTap: (id: string) => void;
}

/**
 * The Reader's layout engine: a fully self-styled WebView (the user never perceives
 * a web page). All communication is JSON messages / injected `window.__reader` calls;
 * the document itself is built once per article and restyled in place.
 */
export const ReaderWebView = forwardRef<ReaderWebViewHandle, Props>(function ReaderWebView(props, ref) {
  const webViewRef = useRef<WebView>(null);
  // The init payload is read at 'ready' time; keep the freshest values in refs so
  // the memoized HTML never rebuilds for them.
  const initRef = useRef({
    charOffset: props.initialCharOffset,
    highlights: props.initialHighlights,
    targetHighlightId: props.targetHighlightId,
  });
  initRef.current = {
    charOffset: props.initialCharOffset,
    highlights: props.initialHighlights,
    targetHighlightId: props.targetHighlightId,
  };

  const html = useMemo(
    () => buildReaderHtml(props.bodyHtml, props.header, props.insets, props.initialPrefs),
    // Rebuild only when the article itself changes — prefs flow through applyPrefs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.bodyHtml],
  );

  const call = (expression: string) => {
    webViewRef.current?.injectJavaScript(`window.__reader && window.__reader.${expression}; true;`);
  };

  useImperativeHandle(ref, () => ({
    applyPrefs: (prefs) => call(`applyPrefs(${JSON.stringify(prefs)})`),
    applyHighlightToSelection: (id) => call(`applyHighlightToSelection(${JSON.stringify(id)})`),
    paintHighlights: (highlights) => {
      for (const h of highlights) {
        call(
          `paintHighlight(${JSON.stringify({
            id: h.id,
            quote: h.quote,
            prefix: h.prefix,
            suffix: h.suffix,
            charOffset: h.charOffset,
          })})`,
        );
      }
    },
    removeHighlight: (id) => call(`removeHighlight(${JSON.stringify(id)})`),
    clearSelection: () => call('clearSelection()'),
    goPage: (delta) => call(`goPage(${delta})`),
  }));

  const onMessage = (event: WebViewMessageEvent) => {
    let message: { type: string } & Record<string, unknown>;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    switch (message.type) {
      case 'ready': {
        const { charOffset, highlights, targetHighlightId } = initRef.current;
        const payload = {
          charOffset,
          targetHighlightId: targetHighlightId ?? null,
          highlights: highlights.map((h) => ({
            id: h.id,
            quote: h.quote,
            prefix: h.prefix,
            suffix: h.suffix,
            charOffset: h.charOffset,
          })),
        };
        webViewRef.current?.injectJavaScript(`window.__reader.init(${JSON.stringify(payload)}); true;`);
        break;
      }
      case 'progress':
        props.onProgress(message as unknown as ReaderProgressEvent);
        break;
      case 'layout':
        props.onLayout(message as unknown as { totalChars: number; pageCount: number });
        break;
      case 'tap':
        props.onTap();
        break;
      case 'link':
        if (typeof message.href === 'string') props.onLink(message.href);
        break;
      case 'selection':
        props.onSelection(message as unknown as ReaderSelection);
        break;
      case 'selection-clear':
        props.onSelection(null);
        break;
      case 'hl-tap':
        if (typeof message.id === 'string') props.onHighlightTap(message.id);
        break;
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      style={[styles.webview, { backgroundColor: props.initialPrefs.bg }]}
      onMessage={onMessage}
      originWhitelist={['*']}
      scrollEnabled={false}
      bounces={false}
      setSupportMultipleWindows={false}
      allowsLinkPreview={false}
      dataDetectorTypes="none"
      hideKeyboardAccessoryView
      webviewDebuggingEnabled={__DEV__}
      // External navigation never happens in-place; links surface via onLink.
      onShouldStartLoadWithRequest={(request) => request.url === 'about:blank' || request.url.startsWith('data:')}
    />
  );
});

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
