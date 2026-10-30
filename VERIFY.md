# Run and verify — Clearly Reformed mobile

This guide takes a cold agent from a clean checkout to the app running on the **iOS Simulator** and the **Android Emulator**, driven by Maestro with screenshots, without asking anyone. [FEATURE_MAP.md](FEATURE_MAP.md) says where every feature lives once you're in. [CLAUDE.md](CLAUDE.md) is the project orientation; this guide doesn't repeat it.

**Last proven:** 2026-10-29 at `844ab51` plus this guide's testIDs, on Asher's Mac (macOS 27, Xcode 27.1, iOS 26.5 Simulator, Android 37.1 `google_apis_playstore_ps16k` arm64 image). Both platforms were walked end to end: Library → Reader → highlight → Save → Notebook, Podcast → Play → Now Playing → Clip moment, Search (online, and offline on Android), Settings, the note editor and the Reader text sheet. Limits are in [What this guide can't prove](#what-this-guide-cant-prove).

> **iOS needs a local-only fix today.** On Xcode 27.1 the committed `expo-modules-jsi@56.0.10` doesn't compile, so iOS can't build from `main` unchanged. Apply the override in [iOS step 1](#1-local-only-expo-modules-jsi-override-xcode-271) and **never commit it**; it goes away once the dependency bump lands in its own PR.

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

Start **every** shell with this block. A fresh shell on this Mac has `xcode-select` pointing at the Command Line Tools, no Java, and a non-UTF-8 locale, and each of those breaks a step below:

```sh
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8          # CocoaPods crashes without it
export ANDROID_HOME=~/Library/Android/sdk
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"   # gradle and maestro
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
W=$(git rev-parse --show-toplevel)                   # this checkout
P=~/.local/state/intrinsic/previews/<your-id>        # scratch: logs, pids, screenshots, DerivedData
mkdir -p $P/logs $P/shots $P/flows
```

Keep build output, logs and screenshots in `$P`, outside the repo.

## Install

```sh
cd $W && pnpm install --frozen-lockfile
```

This applies the four patched dependencies (see CLAUDE.md → Patched dependencies) and runs `react-native-enriched-markdown`'s postinstall asset download. Both are permitted in `pnpm-workspace.yaml`.

## Metro (shared by both platforms)

Start it detached inside an ordinary command, **never** as a background task of your agent session, because the turn can't end while it runs:

```sh
cd $W && CI=1 nohup npx expo start --port 8083 > $P/logs/metro.log 2>&1 & echo $! > $P/metro.pid
curl -s http://localhost:8083/status      # → packager-status:running
```

`CI=1` keeps Expo non-interactive and disables file watching, so restart Metro to pick up source edits (or drop `CI=1` if you're iterating). The first bundle per platform takes 5–35 s; watch for `iOS Bundled` / `Android Bundled` in the log. Restarting Metro disconnects running apps, so relaunch them afterwards.

## iOS Simulator

### 1. Local-only `expo-modules-jsi` override (Xcode 27.1)

`expo-modules-jsi@56.0.10` fails in Swift with `JavaScriptRuntime.swift:219: a C function pointer can only be formed from a reference to a 'func' or a literal closure`. Upstream fixed it in 56.0.13, and 56.0.14 also fixes pod install when the Command Line Tools SDK is newer than Xcode (gotcha 3). Until the bump lands:

```sh
cd $W
perl -0pi -e 's/overrides:\n/overrides:\n  "expo-modules-jsi": 56.0.14\n/' pnpm-workspace.yaml
pnpm install                       # updates pnpm-lock.yaml locally
git diff --stat                    # pnpm-workspace.yaml + pnpm-lock.yaml: DO NOT COMMIT
```

Revert it in [Clean up](#clean-up). If `main` already pins `expo-modules-jsi` ≥ 56.0.13, skip this step and delete it from this guide.

### 2. Generate the native project and pods

`ios/` and `android/` are generated (continuous native generation) and gitignored. Change native config only through `app.json` and config plugins.

```sh
cd $W && CI=1 npx expo prebuild --platform ios      # runs pod install
# if pod install failed or you changed native deps:
cd $W/ios && pod install
```

### 3. Your own simulator

Other sessions keep simulators booted; create and use your own:

```sh
U=$(xcrun simctl create cr-verify "iPhone 17 Pro" com.apple.CoreSimulator.SimRuntime.iOS-26-5)
echo $U > $P/sim-udid && xcrun simctl boot $U
```

### 4. Build (Debug) with xcodebuild

`npx expo run:ios` can't pass the deployment-target override and rejects `--port` together with `--no-bundler`, so build directly. A cold build takes about 15 minutes on a loaded machine; run it detached and poll the log:

```sh
cd $W/ios && nohup xcodebuild -workspace ClearlyReformed.xcworkspace -scheme ClearlyReformed \
  -configuration Debug -destination "id=$U" -derivedDataPath $P/DerivedData \
  IPHONEOS_DEPLOYMENT_TARGET=16.4 build > $P/logs/ios-build.log 2>&1 & echo $! > $P/ios-build.pid
grep -E " error:|\*\* BUILD (SUCCEEDED|FAILED)" $P/logs/ios-build.log
```

`IPHONEOS_DEPLOYMENT_TARGET=16.4` is the app's own target (`ios/Podfile`). Xcode 27.1 treats pods declaring a target below 15 (RNSVG, Reanimated, WebView and others) as errors, so this setting raises them all to 16.4.

### 5. Install, point at Metro, launch

```sh
B=com.asherpope.clearly-reformed-swift
xcrun simctl install $U $P/DerivedData/Build/Products/Debug-iphonesimulator/ClearlyReformed.app
xcrun simctl spawn $U defaults write $B RCT_jsLocation "localhost:8083"   # once per install
xcrun simctl launch $U $B
```

The simulator shares the Mac's loopback, so without `RCT_jsLocation` the app asks `localhost:8081` (llama-server) for its bundle.

## Android Emulator

### 1. Your own AVD

The shared `Pixel_10` AVD is often running for another session, and a second instance of the same AVD refuses to start. With no `cmdline-tools` installed, clone its config (not its data):

```sh
A=~/.android/avd; mkdir -p $A/cr-verify.avd
sed -e 's/^AvdId=.*/AvdId=cr-verify/' -e 's/^avd.ini.displayname=.*/avd.ini.displayname=cr-verify/' \
  $A/Pixel_10.avd/config.ini > $A/cr-verify.avd/config.ini
sed 's#Pixel_10.avd#cr-verify.avd#' $A/Pixel_10.ini > $A/cr-verify.ini
nohup emulator -avd cr-verify -no-snapshot -no-boot-anim -no-audio -no-window > $P/logs/emulator.log 2>&1 &
echo $! > $P/emulator.pid
```

The serial (`emulator-5554`, `-5556`, …) depends on what else is running, so resolve yours by AVD name and wait for boot:

```sh
S=""; until [ -n "$S" ] && [ "$(adb -s $S shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do
  sleep 5; S=$(adb devices | awk '/^emulator-/{print $1}' | while read s; do
    [ "$(adb -s $s emu avd name 2>/dev/null | head -1 | tr -d '\r')" = cr-verify ] && echo $s; done); done
echo $S > $P/emulator-serial
```

### 2. Build (Debug) with gradle

`npx expo run:android` enumerates every attached emulator and crashes when another session's emulator refuses its console (`could not connect to TCP port 5554`). Build with gradle instead. A cold build takes about 10 minutes:

```sh
cd $W && CI=1 npx expo prebuild --platform android     # if android/ doesn't exist yet
cd $W/android && ./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a > $P/logs/android-build.log 2>&1
```

### 3. Install, point at Metro, launch

```sh
PKG=co.intrinsiclabs.clearlyreformed
until adb -s $S shell pm path $PKG >/dev/null 2>&1 || adb -s $S install -r $W/android/app/build/outputs/apk/debug/app-debug.apk; do sleep 3; done
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
xcrun simctl openurl $U "clearlyreformed:///settings"
adb -s $S shell am start -W -a android.intent.action.VIEW -d "clearlyreformed:///settings"
```

On iOS, Maestro's `openLink` (and the first `simctl openurl`) raises Safari's **"Open in 'Clearly Reformed'?"** prompt; follow each `openLink` with `- tapOn: {text: "Open", optional: true}`.

**A study-data walkthrough** that creates disposable data and proves the Reader → Notebook path. Save it as `$P/flows/study.yaml` and run `maestro --device $S test $P/flows/study.yaml` (iOS: swap the appId to `com.asherpope.clearly-reformed-swift` and add the "Open" tap after `openLink`):

```yaml
appId: co.intrinsiclabs.clearlyreformed
---
- openLink: "clearlyreformed:///resource/article/reflections-on-the-esv-after-25-years"
- extendedWaitUntil: { visible: { id: "reader-webview" }, timeout: 60000 }
- longPressOn: { point: "50%,66%" }          # a word in the first paragraph; adjust from a screenshot
- tapOn: { id: "reader-selection-highlight" }
- tapOn: { id: "reader-save" }
- openLink: "clearlyreformed:///notebook"
- extendedWaitUntil: { visible: { id: "notebook-highlight-card" }, timeout: 20000 }
- openLink: "clearlyreformed:///resource/podcast/scroll-less-live-more-with-samuel-james"
- tapOn: { id: "resource-detail-play" }
- extendedWaitUntil: { visible: { id: "audio-now-playing-toggle" }, timeout: 60000 }
- tapOn: { id: "audio-clip-moment" }
- tapOn: { id: "audio-now-playing-toggle" }   # pause
```

## Study data: inspect and reset

Read the database to confirm a write landed:

```sh
# iOS (read-only, straight from the app container)
C=$(xcrun simctl get_app_container $U com.asherpope.clearly-reformed-swift data)
sqlite3 "file:$C/Documents/SQLite/clearly-reformed.db?mode=ro" \
  "select 'highlights',count(*) from highlights union all select 'clips',count(*) from clips union all select 'saved',count(*) from saved_items union all select 'progress',count(*) from progress;"
# Android (copy out, then read; include the -wal or recent writes are missing)
for f in clearly-reformed.db clearly-reformed.db-wal; do adb -s $S exec-out run-as co.intrinsiclabs.clearlyreformed cat files/SQLite/$f > $P/$f; done
sqlite3 $P/clearly-reformed.db "select kind, position, length from progress;"
```

Tables: `highlights`, `clips`, `notes`, `saved_items`, `progress`, `content_cache`, `downloads`, plus the FTS5 tables `notebook_fts` and `content_fts` (`src/data/db/database.ts`). Reader and notification prefs are in `expo-sqlite/kv-store` (`ExpoSQLiteStorage` beside the DB). Downloaded audio is under the app's `Documents/audio/`. **Reset** = wipe the app's data: `adb -s $S shell pm clear co.intrinsiclabs.clearlyreformed` (then rewrite `debug_http_host`), or `xcrun simctl uninstall $U com.asherpope.clearly-reformed-swift` and reinstall (then rewrite `RCT_jsLocation`). There is no in-app reset.

## Online vs offline

- **Online** is the default: every feed, detail page, search and stream comes from the live public sources above.
- **Offline (Android):** `adb -s $S shell cmd connectivity airplane-mode enable` (`disable` to undo). Search then shows "Offline — showing results from your saved content." (`search-offline-note`) with FTS5 results over cached bodies, and saved, cached articles open in the Reader. A body is cached only when it's fetched from the network *while saved*. Reopening in the same session doesn't do it: the detail query stays fresh for an hour (`staleTime`), so React Query serves it from memory. Save the article, **relaunch the app** (`am force-stop` + `am start`, or `simctl terminate` + `launch`), open it again online, then go offline (map: `saved.offline-reading`). The Library, Home rails and online search have no offline fallback.
- **Offline (iOS Simulator): not verifiable per device.** The simulator shares the Mac's network, and the only switch (Network Link Conditioner) affects the whole machine and every other session. Don't use it.

## Screenshots

```sh
xcrun simctl io $U screenshot $P/shots/ios-01-home.png
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
lsof -nP -iTCP:8083 -sTCP:LISTEN          # confirm the PID matches
kill $(cat $P/metro.pid); pkill -f "expo start --port 8083"
adb -s $S emu kill && rm -rf ~/.android/avd/cr-verify.avd ~/.android/avd/cr-verify.ini
xcrun simctl shutdown $U && xcrun simctl delete $U
rm -rf $P/DerivedData                     # several GB
cd $W && git checkout pnpm-workspace.yaml pnpm-lock.yaml && pnpm install   # drop the iOS override
git status --short                        # only your intended changes
```

`ios/` and `android/` (gitignored, a few GB with build outputs) can be deleted too; `npx expo prebuild` regenerates them. The disk on this Mac is watched.

## Gotchas (all hit while writing this guide)

1. **`expo-modules-jsi@56.0.10` vs Xcode 27.1:** a Swift compile error. Use the local override (iOS step 1).
2. **Pods with old deployment targets fail on Xcode 27.1:** pass `IPHONEOS_DEPLOYMENT_TARGET=16.4` to xcodebuild.
3. **`pod install` → `ld: library 'System' not found`** in `expo-modules-jsi`'s `create-stub-xcframework.sh`: the login PATH puts `/Library/Developer/CommandLineTools/usr/bin` first, so a bare `clang` has no SDK. jsi ≥ 56.0.14 fixes it; on 56.0.10, run pod install with `PATH=/usr/bin:$PATH`.
4. **CocoaPods `Unicode Normalization not appropriate for ASCII-8BIT`:** set `LANG`/`LC_ALL` to `en_US.UTF-8`.
5. **`xcrun: unable to find utility "simctl"`:** set `DEVELOPER_DIR`.
6. **`Unable to locate a Java Runtime`** from gradle or **maestro**: set `JAVA_HOME` to Android Studio's JBR.
7. **The debug app loads from 8081 = llama-server:** set `RCT_jsLocation` (iOS) or `debug_http_host` + `adb reverse` (Android).
8. **`expo run:android` crashes on another session's emulator; `expo run:ios` rejects `--port` with `--no-bundler`:** build with gradle or xcodebuild directly.
9. **The shared CoreSimulator service can wedge** (every `simctl` call hangs for minutes, for every session). Don't kill it, because other owners' simulators depend on it. Wrap calls in a limit (`perl -e 'alarm 30; exec @ARGV' xcrun simctl …`), do Android work meanwhile, and retry; it recovered by itself after about 10 minutes.
10. **The emulator serial isn't stable;** resolve it by AVD name every session.
11. **The machine is shared and often heavily loaded** (load average 300–800 on 10 cores while writing this). Cold builds took 10–15 minutes and the first bundle on the emulator up to a minute. Use long `extendedWaitUntil` timeouts.
12. **Home keeps its scroll position** between visits; a `scrollUntilVisible` toward an element already passed needs `direction: UP`.

## What this guide can't prove

- **Signed-in state and sync:** not built. Unavailable, not skipped.
- **iOS from `main` unchanged:** blocked on Xcode 27.1 until the `expo-modules-jsi` bump lands (iOS step 1).
- **iOS offline behavior:** not reproducible per simulator (above).
- **Physical-device feel, background and lock-screen audio, CarPlay and Android Auto, notification delivery:** need hardware or production push and are out of scope here. The remote Pixel path is `pnpm android:remote` (CLAUDE.md).
- **Release builds:** this guide proves Debug + Metro. Release and TestFlight builds go through EAS and the project's release procedure.
