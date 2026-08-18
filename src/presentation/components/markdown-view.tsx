import { Fragment } from 'react';
import { Platform, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { parseMarkdown, type MarkdownBlock, type MarkdownInline } from '@/presentation/lib/markdown';
import { Colors, Fonts } from '@/presentation/theme';

/**
 * Renders the Notebook's Markdown subset (see `lib/markdown.ts`) as native text.
 *
 * Deliberately no third-party renderer: the subset is small, the type has to come
 * from the app's own scale, and everything stays selectable native `Text` rather
 * than a WebView.
 */
export function MarkdownView({
  markdown,
  bodyStyle,
  numberOfLines,
}: {
  markdown: string;
  /** Overrides for the base body run (size/colour) — headings scale off it. */
  bodyStyle?: TextStyle;
  /** When set, the whole note collapses to one clamped run (card previews). */
  numberOfLines?: number;
}) {
  const blocks = parseMarkdown(markdown);

  if (numberOfLines != null) {
    return (
      <Text style={[styles.body, bodyStyle]} numberOfLines={numberOfLines}>
        {blocks.map((block, index) => (
          <Fragment key={index}>
            {index > 0 ? '\n' : null}
            <InlineRun nodes={blockChildren(block)} />
          </Fragment>
        ))}
      </Text>
    );
  }

  return (
    <View>
      {blocks.map((block, index) => (
        <Block key={index} block={block} bodyStyle={bodyStyle} first={index === 0} />
      ))}
    </View>
  );
}

function blockChildren(block: MarkdownBlock): readonly MarkdownInline[] {
  return block.kind === 'rule' ? [] : block.children;
}

function Block({
  block,
  bodyStyle,
  first,
}: {
  block: MarkdownBlock;
  bodyStyle?: TextStyle;
  first: boolean;
}) {
  const topGap = first ? styles.noTopGap : null;

  switch (block.kind) {
    case 'rule':
      return <View style={[styles.rule, topGap]} />;

    case 'heading': {
      const level = styles[`heading${block.level}` as const];
      return (
        <Text style={[styles.heading, level, topGap]}>
          <InlineRun nodes={block.children} />
        </Text>
      );
    }

    case 'quote':
      return (
        <View style={[styles.quote, topGap]}>
          <Text style={[styles.body, styles.quoteText, bodyStyle]}>
            <InlineRun nodes={block.children} />
          </Text>
        </View>
      );

    case 'bullet':
    case 'ordered':
      return (
        <View style={[styles.listRow, topGap]}>
          <Text style={[styles.body, styles.listMarker, bodyStyle]}>
            {block.kind === 'bullet' ? '•' : block.marker}
          </Text>
          <Text style={[styles.body, styles.listText, bodyStyle]}>
            <InlineRun nodes={block.children} />
          </Text>
        </View>
      );

    default:
      return (
        <Text style={[styles.body, styles.paragraph, topGap, bodyStyle]}>
          <InlineRun nodes={block.children} />
        </Text>
      );
  }
}

/**
 * Emphasis composes through nested `Text` inheritance rather than merged style
 * objects, so `**bold *and* italic**` resolves to a single bold-italic face.
 */
function InlineRun({ nodes }: { nodes: readonly MarkdownInline[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.kind) {
          case 'text':
            return <Fragment key={index}>{node.text}</Fragment>;
          case 'code':
            return (
              <Text key={index} style={styles.code}>
                {node.text}
              </Text>
            );
          case 'strong':
            return (
              <Text key={index} style={styles.strong}>
                <InlineRun nodes={node.children} />
              </Text>
            );
          case 'em':
            return (
              <Text key={index} style={styles.em}>
                <InlineRun nodes={node.children} />
              </Text>
            );
        }
      })}
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    color: '#4A4232',
  },
  paragraph: {
    marginTop: 14,
  },
  heading: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.ink,
    marginTop: 22,
    marginBottom: 2,
  },
  heading1: {
    fontSize: 23,
    lineHeight: 28,
  },
  heading2: {
    fontSize: 19.5,
    lineHeight: 25,
  },
  heading3: {
    fontSize: 17,
    lineHeight: 23,
    color: Colors.inkSoft,
  },
  listRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  listMarker: {
    width: 22,
    color: Colors.goldDeep,
  },
  listText: {
    flex: 1,
  },
  quote: {
    borderLeftWidth: 2.5,
    borderLeftColor: Colors.goldDeep,
    paddingLeft: 13,
    marginTop: 14,
  },
  quoteText: {
    color: Colors.bodyText,
  },
  rule: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  noTopGap: {
    marginTop: 0,
  },
  strong: {
    // Family swap only — a fontWeight on a single-weight custom family makes
    // iOS fall back to the system face.
    fontFamily: Fonts.sansSemiBold,
    color: Colors.ink,
  },
  em: {
    fontFamily: Fonts.sansItalic,
  },
  code: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 14.5,
    color: Colors.inkSoft,
  },
});
