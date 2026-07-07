import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/presentation/components/icons';
import { useDownloadsList } from '@/presentation/hooks/queries/use-downloads';
import {
  setNotificationPref,
  useNotificationPrefs,
  type NotificationPrefs,
} from '@/presentation/notifications/notification-prefs';
import { useUseCases } from '@/presentation/providers/use-cases-context';
import { Colors, Fonts, Radius, Spacing, Type } from '@/presentation/theme';

const CATEGORY_TOGGLES: readonly { key: keyof NotificationPrefs; label: string }[] = [
  { key: 'newArticles', label: 'New articles' },
  { key: 'newEpisodes', label: 'New podcast episodes' },
  { key: 'newVideos', label: 'New videos' },
  { key: 'conferenceUpdates', label: 'Conference updates' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const prefs = useNotificationPrefs();
  const downloads = useDownloadsList();
  const { downloads: downloadsUseCases } = useUseCases();
  const queryClient = useQueryClient();

  const onToggle = async (key: keyof NotificationPrefs, value: boolean) => {
    const ok = await setNotificationPref(key, value);
    if (!ok) {
      Alert.alert('Notifications are off', 'Allow notifications for Clearly Reformed in system Settings first.');
    }
  };

  const downloadedCount = (downloads.data ?? []).filter((d) => d.status === 'done').length;
  const downloadedBytes = (downloads.data ?? []).reduce((sum, d) => sum + (d.bytesTotal ?? 0), 0);
  const downloadedMb = Math.round(downloadedBytes / (1024 * 1024));

  const onClearDownloads = () => {
    Alert.alert('Remove all downloads?', 'Downloaded audio files will be deleted from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove all',
        style: 'destructive',
        onPress: async () => {
          for (const record of downloads.data ?? []) {
            await downloadsUseCases.remove(record.resource.key).catch(() => {});
          }
          queryClient.invalidateQueries({ queryKey: ['downloads'] });
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.title}>Settings</Text>
        <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={8} accessibilityLabel="Close settings">
          <CloseIcon size={13} color={Colors.inkSoft} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.group}>
          <Row
            label="Daily pick reminder"
            caption="A quiet nudge at 8:00 each morning."
            value={prefs.dailyReminder}
            onChange={(value) => onToggle('dailyReminder', value)}
          />
        </View>
        <View style={[styles.group, { marginTop: 12 }]}>
          {CATEGORY_TOGGLES.map(({ key, label }, index) => (
            <Row
              key={key}
              label={label}
              value={prefs[key] as boolean}
              onChange={(value) => onToggle(key, value)}
              divider={index > 0}
            />
          ))}
        </View>
        <Text style={styles.footnote}>
          New-content alerts take effect when publishing notifications launch; your choices here carry over.
        </Text>

        {/* Downloads */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Downloads</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Downloaded audio</Text>
              <Text style={styles.rowCaption}>
                {downloadedCount === 0
                  ? 'Nothing downloaded yet'
                  : `${downloadedCount} item${downloadedCount === 1 ? '' : 's'}${downloadedMb > 0 ? ` · ${downloadedMb} MB` : ''}`}
              </Text>
            </View>
            {downloadedCount > 0 ? (
              <Pressable onPress={onClearDownloads} hitSlop={6}>
                <Text style={styles.destructive}>Remove all</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* About */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>About</Text>
        <View style={styles.group}>
          <Pressable style={styles.row} onPress={() => Linking.openURL('https://clearlyreformed.org')}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>clearlyreformed.org</Text>
              <Text style={styles.rowCaption}>The ministry of Kevin DeYoung — theology for the everyday.</Text>
            </View>
          </Pressable>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowCaption}>0.1.0 — local-first; nothing you do here leaves this device.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  caption,
  value,
  onChange,
  divider = false,
}: {
  label: string;
  caption?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  divider?: boolean;
}) {
  return (
    <>
      {divider ? <View style={styles.divider} /> : null}
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{label}</Text>
          {caption ? <Text style={styles.rowCaption}>{caption}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: Colors.gold, false: Colors.borderChrome }}
          thumbColor={Colors.white}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Type.display,
    fontSize: 24,
    color: Colors.ink,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  sectionLabel: {
    ...Type.eyebrow,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  group: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
    paddingVertical: 13,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14.5,
    color: Colors.ink,
  },
  rowCaption: {
    ...Type.meta,
    color: Colors.textMuted,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSoft,
  },
  destructive: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: '#A03D2E',
  },
  footnote: {
    ...Type.meta,
    color: Colors.textMuted,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
