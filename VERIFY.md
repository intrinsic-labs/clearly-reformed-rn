# Run and verify — Clearly Reformed mobile

This guide takes a cold agent from a clean checkout to the app running on the **iOS Simulator** and the **Android Emulator**, driven by Maestro with screenshots, without asking anyone. [FEATURE_MAP.md](FEATURE_MAP.md) says where every feature lives once you're in. [CLAUDE.md](CLAUDE.md) is the project orientation; this guide doesn't repeat it.

**Last proven:** 2026-10-30 (iOS build path: fresh `prebuild --clean` and `npx expo run:ios` on Xcode 27.1 / iOS 26.5 Simulator, no overrides; Reader selection, Notebook, note editor and audio walked; Android debug build and launch re-checked). The full flows below were last walked end to end on 2026-10-29 by a separate agent from a fresh clone, on Asher's Mac (macOS 27, Xcode 27.1, iOS 26.5 Simulator, Android 37.1 `google_apis_playstore_ps16k` arm64 image). Limits are in [What this guide can't prove](#what-this-guide-cant-prove).


## Facts you need first

- **No accounts, no sign-in, no backend of ours.** Auth and sync aren't built (see `account.sync` in the map). There is no review-sign-in mode to enable and no synthetic reviewer: the app is fully usable signed out, which is the only state it has. Signed-in and sync verification is **unavailable**. Don't build it to satisfy this guide.
- **Content is the ministry's live public site,** read-only: WordPress REST at `https://control.kdy.org/wp-json` and the podcast RSS at `https://media.rss.com/lbe/feed.xml`. The app only GETs, so a review can't write to production. It does need the network, and the content changes daily (Today's pick, the top of each feed).
- **Study data is device-local.** Highlights, clips, notes, saved items, progress, downloads and cached bodies live in one SQLite file on the simulator or emulator. Use your own disposable devices (below), never someone's real phone, and reset them when you finish.
- **No `expo-dev-client`.** A debug build is a plain React Native debug app that loads JS from Metro on a fixed host and port. The `expo-development-client` deep link and its launcher screen don't exist here. Point the app at your Metro with the per-platform step below.
- **Ports on this Mac.** `8081` (Metro's default) is **llama-server**, and other sessions run Metro on `8082`. This guide uses **8083**. Check before you start, and pick another port if 8083 is taken:

  ```sh
  lsof -nP -iTCP:8083 -sTCP:LISTEN   # empty output = free
  ```

## Prerequisites

| Need | Where it comes from |
|---|---|
| Node 24 (proven on 24.16.0) and pnpm 11 (11.9.0) | nvm; the repo declares no `.nvmrc` or `engines` |
| Xcode 27.1 with the iOS 26.5 Simulator runtime | `/Applications/Xcode.app` |
| CocoaPods 1.16 | Homebrew |
| Android SDK, emulator and the Android 37.1 arm64 system image | `~/Library/Android/sdk` (no `cmdline-tools`; see the AVD step) |
| A JDK | Android Studio's bundled JBR |
| Maestro | Homebrew (`/opt/homebrew/bin/maestro`) |

A fresh shell on this Mac has `xcode-select` pointing at the Command Line Tools, no Java, and a non-UTF-8 locale, and each of those breaks a step below. Agent tool calls each get a fresh shell, so write this once to `$P/env.sh` (with your real paths) and start **every** command with `source $P/env.sh`:

```sh
W=/absolute/path/to/this/checkout                    # e.g. your worktree
P=~/.local/state/intrinsic/previews/<your-id>        # scratch: logs, pids, screenshots, DerivedData
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8          # CocoaPods crashes without it
export ANDROID_HOME=~/Library/Android/sdk
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"   # gradle and maestro
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
mkdir -p $P/logs $P/shots $P/flows
sc() { perl -e 'alarm 60; exec @ARGV' xcrun simctl "$@"; }   # simctl with a 60 s limit (gotcha 6)
[ -f $P/sim-udid ] && U=$(cat $P/sim-udid)                    # set by iOS step 2
[ -f $P/emulator-serial ] && S=$(cat $P/emulator-serial)      # set by Android step 1
B=com.asherpope.clearly-reformed-swift; PKG=co.intrinsiclabs.clearlyreformed
DEV=cr-verify-$(basename $P)                                 # your device names; unique per session so you never select or delete another session's
```

Keep every wait bounded (`for i in $(seq 1 60); do …; sleep 5; done`, not a bare `until`), and keep each command under 10 minutes; poll detached jobs' logs instead.

Keep build output, logs and screenshots in `$P`, outside the repo.

## Install

```sh
cd $W && pnpm install --frozen-lockfile
```

This applies the four patched dependencies (see CLAUDE.md → Patched dependencies) and runs `react-native-enriched-markdown`'s postinstall asset download. Both are permitted in `pnpm-workspace.yaml`.

## Metro (shared by both platforms)

Start it detached inside an ordinary command, **never** as a background task of your agent session, because the turn can't end while it runs:

```sh
cd $W && CI=1 nohup npx expo start --port 8083 > $P/logs/metro.log 2>&1 &
for i in $(seq 1 30); do curl -s http://localhost:8083/status | grep -q running && break; sleep 2; done
lsof -t -nP -iTCP:8083 -sTCP:LISTEN > $P/metro.pid    # the listener (a child of the npx wrapper)
```

`CI=1` keeps Expo non-interactive and disables file watching, so restart Metro to pick up source edits (or drop `CI=1` if you're iterating). The first bundle per platform takes 5–35 s; watch for `iOS Bundled` / `Android Bundled` in the log. Restarting Metro disconnects running apps, so relaunch them afterwards.

## iOS Simulator

### 1. Generate the native project and pods

`ios/` and `android/` are generated (continuous native generation) and gitignored. Change native config only through `app.json` and config plugins.

```sh
cd $W && CI=1 npx expo prebuild --platform ios      # runs pod install
# if pod install failed or you changed native deps:
cd $W/ios && pod install
```

### 2. Your own simulator

Other sessions keep simulators booted; create and use your own:

```sh
U=$(sc create $DEV "iPhone 17 Pro" com.apple.CoreSimulator.SimRuntime.iOS-26-5)
echo $U > $P/sim-udid && sc boot $U
```

### 3. Build and install (Debug)

The standard path works as is: pods come out of `prebuild` already clean (`plugins/withPodDeploymentTargetFloor.js` lifts pods below iOS 15.1 and `expo-modules-jsi` ≥ 56.0.14 builds on Xcode 27.1), so no deployment-target override is needed. A cold build takes about 15 minutes on a loaded machine (about 4 on a quiet one); run it detached and poll the log:

```sh
cd $W && CI=1 nohup npx expo run:ios --port 8083 --device $U > $P/logs/run-ios.log 2>&1 & echo $! > $P/run-ios.pid
grep -E "Build Succeeded|CommandError|❌" $P/logs/run-ios.log
```

`run:ios` also starts Metro on 8083 (so skip the separate Metro section for iOS-only work), builds, installs and launches. Ignore the two `❌ error: the following command failed with exit code 0 but produced no further output` lines from the ExpoModulesJSI script phase; the build still reports `Build Succeeded`. The first launch shows "No script URL provided" until step 4 points it at Metro.

### 4. Point at Metro, launch

```sh
sc spawn $U defaults write $B RCT_jsLocation "localhost:8083"   # once per install
sc terminate $U $B; sc launch $U $B
```

The simulator shares the Mac's loopback, so without `RCT_jsLocation` the app asks `localhost:8081` (llama-server) for its bundle.

## Android Emulator

### 1. Your own AVD

The shared `Pixel_10` AVD is often running for another session, and a second instance of the same AVD refuses to start. With no `cmdline-tools` installed, clone its config (not its data):

```sh
A=~/.android/avd; mkdir -p $A/$DEV.avd
sed -e "s/^AvdId=.*/AvdId=$DEV/" -e "s/^avd.ini.displayname=.*/avd.ini.displayname=$DEV/" \
  $A/Pixel_10.avd/config.ini > $A/$DEV.avd/config.ini
sed "s#Pixel_10.avd#$DEV.avd#" $A/Pixel_10.ini > $A/$DEV.ini
nohup emulator -avd $DEV -no-snapshot -no-boot-anim -no-audio -no-window > $P/logs/emulator.log 2>&1 &
echo $! > $P/emulator.pid
```

The serial (`emulator-5554`, `-5556`, …) depends on what else is running, so resolve yours by AVD name and wait for boot:

```sh
for i in $(seq 1 60); do
  S=$(adb devices | awk '/^emulator-/{print $1}' | while read s; do
    [ "$(adb -s $s emu avd name 2>/dev/null | head -1 | tr -d '\r')" = $DEV ] && echo $s; done)
  [ -n "$S" ] && [ "$(adb -s $S shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ] && break; sleep 5; done
echo $S > $P/emulator-serial
```

### 2. Build (Debug) with gradle

`npx expo run:android` enumerates every attached emulator and crashes when another session's emulator refuses its console (`could not connect to TCP port 5554`). Build with gradle instead. A cold build takes about 10 minutes:

```sh
cd $W && CI=1 npx expo prebuild --platform android     # if android/ doesn't exist yet
cd $W/android && nohup ./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a > $P/logs/android-build.log 2>&1 &
grep -E "BUILD (SUCCESSFUL|FAILED)" $P/logs/android-build.log     # poll
```

### 3. Install, point at Metro, launch

```sh
for i in $(seq 1 20); do adb -s $S install -r $W/android/app/build/outputs/apk/debug/app-debug.apk && break; sleep 3; done
adb -s $S reverse tcp:8083 tcp:8083
adb -s $S shell "run-as $PKG sh -c 'mkdir -p shared_prefs && echo \"<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\" standalone=\\\"yes\\\" ?><map><string name=\\\"debug_http_host\\\">localhost:8083</string></map>\" > shared_prefs/${PKG}_preferences.xml'"
adb -s $S shell am start -W -n $PKG/.MainActivity
```

An emulator's debug build defaults to `10.0.2.2:8081`, the **Mac's** 8081 (llama-server) and not an `adb reverse` port, and it fails with "Unable to load script". The `debug_http_host` pref plus `adb reverse` fixes that. The pref survives relaunches; rewrite it after a reinstall or `pm clear`. Right after boot, `am start` can report "Activity class … does not exist" until the package manager is ready; wait a few seconds and retry.

## Drive it

**Selectors.** The app uses React Native `testID`s, which Maestro reads as `id:` on both platforms. The map's Selector fields say which ones work where. Dump what's actually on screen with:

```sh
maestro --device <$U or $S> hierarchy > $P/logs/hier.json
grep -o '"resource-id" : "[a-z][a-z0-9-]*"' $P/logs/hier.json | sort -u
```

Platform differences worth knowing up front: tabs are `id: shell-tabs-library` on iOS but only `tapOn: "Library"` (label) on Android, and the label works on both. Library dropdown options are `id: library-filters-type-option-article` on Android but invisible to iOS's tree, so tap by point there or use a deep link. Reader text lives in a WebView: long-press a word by point to select it.

**Deep links** (scheme `clearlyreformed://`, three slashes): `/`, `/library`, `/notebook`, `/search`, `/settings`, `/player`, `/note-editor`, `/resource/<type>/<slug>` (with `?hl=<highlightId>` or `?t=<seconds>`). Known-good targets: `clearlyreformed:///resource/article/reflections-on-the-esv-after-25-years` (Reader) and `clearlyreformed:///resource/podcast/scroll-less-live-more-with-samuel-james` (a playable *Life and Books and Everything* episode; cross-posted guest podcasts have no Play pill).

```sh
sc openurl $U "clearlyreformed:///settings"
adb -s $S shell am start -W -a android.intent.action.VIEW -d "clearlyreformed:///settings"
```

On iOS, Maestro's `openLink` (and the first `simctl openurl`) raises Safari's **"Open in 'Clearly Reformed'?"** prompt; follow each `openLink` with `- tapOn: {text: "Open", optional: true}`.

**Library → Articles** (the menu path, when you want it rather than a deep link):

```yaml
# Android
- tapOn: "Library"
- tapOn: { id: "library-filters-type" }
- tapOn: { id: "library-filters-type-option-article" }
- tapOn: { id: "resource-card", index: 0 }
# iOS (options aren't in the tree; points measured on iPhone 17 Pro with the list scrolled to the top)
- tapOn: { id: "shell-tabs-library" }
- tapOn: { id: "library-filters-type" }
- waitForAnimationToEnd
- tapOn: { point: "63%,74%" }        # "Articles"; "Podcast" is 63%,83%. The menu moves with scroll, so check a screenshot
- tapOn: { id: "resource-card", index: 0 }
```

**A study-data walkthrough** that creates disposable data and proves the Reader → Notebook path. Save it as `$P/flows/study.yaml` and run `maestro --device $S test $P/flows/study.yaml` (iOS: swap the appId to `com.asherpope.clearly-reformed-swift` and add the "Open" tap after `openLink`):

```yaml
appId: co.intrinsiclabs.clearlyreformed
---
- openLink: "clearlyreformed:///resource/article/reflections-on-the-esv-after-25-years"
- extendedWaitUntil: { visible: { id: "reader-webview" }, timeout: 60000 }
- longPressOn: { point: "50%,66%" }          # Android: a word in the first paragraph. iOS: use "46%,69%"; check a screenshot
- tapOn: { id: "reader-selection-highlight" }  # saves the highlight
- tapOn: { id: "reader-save" }                 # bookmarks the article (a separate SAVED card)
- openLink: "clearlyreformed:///notebook"
- extendedWaitUntil: { visible: { id: "notebook-highlight-card" }, timeout: 20000 }
- openLink: "clearlyreformed:///resource/podcast/scroll-less-live-more-with-samuel-james"
- tapOn: { id: "resource-detail-play" }
- extendedWaitUntil: { visible: { id: "audio-now-playing-toggle" }, timeout: 60000 }
- extendedWaitUntil: { visible: "0:0[3-9]", timeout: 30000 }   # let playback start; iOS can sit at 0:00 a few seconds
- tapOn: { id: "audio-clip-moment" }           # iOS shows "Saved m:ss" briefly; Android may not show it in a capture, so check the DB
- tapOn: { id: "audio-now-playing-toggle" }   # pause
```

## Study data: inspect and reset

Read the database to confirm a write landed:

```sh
# iOS (read-only, straight from the app container)
C=$(sc get_app_container $U com.asherpope.clearly-reformed-swift data)
sqlite3 "file:$C/Documents/SQLite/clearly-reformed.db?mode=ro" \
  "select 'highlights',count(*) from highlights union all select 'clips',count(*) from clips union all select 'saved',count(*) from saved_items union all select 'progress',count(*) from progress;"
# Android (copy out, then read; include the -wal or recent writes are missing)
for f in clearly-reformed.db clearly-reformed.db-wal; do adb -s $S exec-out run-as co.intrinsiclabs.clearlyreformed cat files/SQLite/$f > $P/$f; done
sqlite3 $P/clearly-reformed.db "select 'highlights',count(*) from highlights union all select 'clips',count(*) from clips union all select 'saved',count(*) from saved_items union all select 'progress',count(*) from progress; select kind, position, length from progress;"
```

Tables: `highlights`, `clips`, `notes`, `saved_items`, `progress`, `content_cache`, `downloads`, plus the FTS5 tables `notebook_fts` and `content_fts` (`src/data/db/database.ts`). Reader and notification prefs are in `expo-sqlite/kv-store` (`ExpoSQLiteStorage` beside the DB). Downloaded audio is under the app's `Documents/audio/`. **Reset** = wipe the app's data: `adb -s $S shell pm clear co.intrinsiclabs.clearlyreformed` (then rewrite `debug_http_host`), or `xcrun simctl uninstall $U com.asherpope.clearly-reformed-swift` and reinstall (then rewrite `RCT_jsLocation`). There is no in-app reset.

## Online vs offline

- **Online** is the default: every feed, detail page, search and stream comes from the live public sources above.
- **Offline (Android):** `adb -s $S shell cmd connectivity airplane-mode enable` (`disable` to undo). Search then shows "Offline — showing results from your saved content." (`search-offline-note`) with FTS5 results over cached bodies, and saved, cached articles open in the Reader. A body is cached only when it's fetched from the network *while saved*. Reopening in the same session doesn't do it: the detail query stays fresh for an hour (`staleTime`), so React Query serves it from memory. Save the article, **relaunch the app** (`am force-stop` + `am start`, or `simctl terminate` + `launch`), open it again online, then go offline (map: `saved.offline-reading`). The Library, Home rails and online search have no offline fallback.
- **Offline (iOS Simulator): not verifiable per device.** The simulator shares the Mac's network, and the only switch (Network Link Conditioner) affects the whole machine and every other session. Don't use it.

## Screenshots

```sh
sc io $U screenshot $P/shots/ios-01-home.png
adb -s $S exec-out screencap -p > $P/shots/android-01-home.png
```

Name them `<platform>-NN-<what>.png`, label them as Simulator or Emulator captures in any handoff, and don't let them stand in for physical-device feel, audio routing, CarPlay or performance. Maestro's `takeScreenshot` always writes under `~/.maestro/tests/<run>/…`, even when given an absolute path; copy the files out, then delete that run folder.

## Checks

```sh
cd $W && pnpm typecheck && pnpm lint && pnpm test
CHECK=~/Documents/obsidian/intrinsic-labs-v01/Tools/skills/feature-mapping/check_map.md
awk '/^```python$/{f=1;next} /^```$/{f=0} f' "$CHECK" | python3 - FEATURE_MAP.md --routes 'src/app/**/*.tsx' --strict
```

There's no CI in this repo; these are the gate. None of them reach native code or the patched native deps. Verifying those means a rebuild and a walk (CLAUDE.md → Patched dependencies).

## Clean up

Stop only what you started, by the PID you recorded, after checking it is what holds the port:

```sh
[ "$(lsof -t -nP -iTCP:8083 -sTCP:LISTEN)" = "$(cat $P/metro.pid)" ] && kill $(cat $P/metro.pid)   # also ends its npx wrapper
adb -s $S emu kill && rm -rf ~/.android/avd/$DEV.avd ~/.android/avd/$DEV.ini
sc shutdown $U; sc delete $U
rm -rf ~/.maestro/tests/<your run folders>   # takeScreenshot output and logs
rm -rf ~/Library/Developer/Xcode/DerivedData/ClearlyReformed-*   # several GB (run:ios builds there)
git status --short                        # only your intended changes
```

`ios/` and `android/` (gitignored, a few GB with build outputs) can be deleted too; `npx expo prebuild` regenerates them. The disk on this Mac is watched.

## Gotchas (all hit while writing this guide)

1. **CocoaPods `Unicode Normalization not appropriate for ASCII-8BIT`:** set `LANG`/`LC_ALL` to `en_US.UTF-8`.
2. **`xcrun: unable to find utility "simctl"`:** set `DEVELOPER_DIR`.
3. **`Unable to locate a Java Runtime`** from gradle or **maestro**: set `JAVA_HOME` to Android Studio's JBR.
4. **The debug app loads from 8081 = llama-server:** set `RCT_jsLocation` (iOS) or `debug_http_host` + `adb reverse` (Android).
5. **`expo run:android` crashes on another session's emulator:** build with gradle directly (Android step 2). `expo run:ios --device $U` is fine because it targets your own simulator.
6. **The shared CoreSimulator service can wedge** (every `simctl` call hangs for minutes, for every session). Don't kill it, because other owners' simulators depend on it. Use the `sc` wrapper from the setup block, do Android work meanwhile, and retry; it recovered by itself after about 10 minutes.
7. **The emulator serial isn't stable;** resolve it by AVD name every session.
8. **The machine is shared and often heavily loaded** (load average 300–800 on 10 cores while writing this). Cold builds took 10–15 minutes and the first bundle on the emulator up to a minute. Use long `extendedWaitUntil` timeouts.
9. **Home keeps its scroll position** between visits; a `scrollUntilVisible` toward an element already passed needs `direction: UP`.

## What this guide can't prove

- **Signed-in state and sync:** not built. Unavailable, not skipped.
- **iOS offline behavior:** not reproducible per simulator (above).
- **Physical-device feel, background and lock-screen audio, CarPlay and Android Auto, notification delivery:** need hardware or production push and are out of scope here. The remote Pixel path is `pnpm android:remote` (CLAUDE.md).
- **Release builds:** this guide proves Debug + Metro. Release and TestFlight builds go through EAS and the project's release procedure.
