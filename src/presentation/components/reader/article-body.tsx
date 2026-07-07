import { Image } from 'expo-image';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ReaderBlock } from '@/presentation/lib/html';
import { Fonts, Reader, Spacing } from '@/presentation/theme';

/**
 * Renders parsed {@link ReaderBlock}s as native typography on the reading surface.
 * Interim view — block structure only; the WebView Reader will render full inline HTML.
 */
export function ArticleBody({ blocks }: { blocks: readonly ReaderBlock[] }) {
  return (
    <View>
      {blocks.map((block, i) => (
        <Fragment key={i}>{renderBlock(block)}</Fragment>
      ))}
    </View>
  );
}

function renderBlock(block: ReaderBlock) {
  switch (block.kind) {
    case 'heading':
      return <Text style={block.level === 2 ? styles.h2 : styles.h3}>{block.text}</Text>;
    case 'quote':
      return (
        <View style={styles.quote}>
          <Text style={styles.quoteText}>{block.text}</Text>
        </View>
      );
    case 'image':
      return (
        <Image source={{ uri: block.src }} style={styles.image} contentFit="cover" transition={150} />
      );
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, j) => (
            <View key={j} style={styles.listItem}>
              <Text style={styles.bullet}>{block.ordered ? `${j + 1}.` : '•'}</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'paragraph':
    default:
      return <Text style={styles.paragraph}>{block.text}</Text>;
  }
}

const styles = StyleSheet.create({
  paragraph: {
    fontFamily: Fonts.serifText,
    fontSize: 18,
    lineHeight: 29,
    color: Reader.fg,
    marginBottom: 18,
  },
  h2: {
    fontFamily: Fonts.serifBold,
    fontSize: 21,
    lineHeight: 26,
    color: Reader.fg,
    marginTop: 12,
    marginBottom: 10,
  },
  h3: {
    fontFamily: Fonts.serifBold,
    fontSize: 18,
    lineHeight: 23,
    color: Reader.fg,
    marginTop: 10,
    marginBottom: 8,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: Reader.accent,
    paddingLeft: Spacing.lg,
    marginVertical: Spacing.lg,
  },
  quoteText: {
    fontFamily: Fonts.serif,
    fontSize: 21,
    lineHeight: 28,
    color: Reader.fg,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: Reader.hair,
    marginVertical: Spacing.lg,
  },
  list: {
    marginBottom: 18,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bullet: {
    fontFamily: Fonts.serifText,
    fontSize: 18,
    lineHeight: 29,
    color: Reader.accent,
    minWidth: 18,
  },
  listText: {
    flex: 1,
    fontFamily: Fonts.serifText,
    fontSize: 18,
    lineHeight: 29,
    color: Reader.fg,
  },
});
