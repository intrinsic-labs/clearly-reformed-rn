#!/bin/zsh
# Connect a remote Android device over Tailscale/ZeroTier, tunnel Metro to it, and
# open the dev client — without the phone sharing a LAN with this Mac.
#
#   pnpm android:remote <device-ip> [--pair PORT CODE] [--build]
#
# Flow: (1) pair if asked, (2) find the wireless-debugging port by scanning the
# device (mDNS doesn't cross an overlay network), (3) adb connect, (4) optionally
# `expo run:android`, (5) relay a spare local port to Metro and `adb reverse`
# the phone's 8081 onto it, (6) launch the dev client at localhost:8081.
#
# Why the relay: `adb reverse` targets 127.0.0.1 on the Mac, and anything else
# bound to IPv4 loopback:8081 (a local LLM server, another Metro) wins over
# Metro's dual-stack socket. Relaying through a free port sidesteps that.
#
# Metro must already be running (`pnpm start`). The relay's upstream is this
# Mac's Tailscale IPv4 so the loopback collision can't recur.

set -euo pipefail
cd "$(dirname "$0")/.."

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

SCHEME=$(node -p "require('./app.json').expo.scheme")
PACKAGE=$(node -p "require('./app.json').expo.android.package")
METRO_PORT=8081
RELAY_PORT=${RELAY_PORT:-8082}

DEVICE_IP=${1:?usage: android-remote.sh <device-ip> [--pair PORT CODE] [--build]}
shift
PAIR_PORT="" PAIR_CODE="" BUILD=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pair) PAIR_PORT=$2; PAIR_CODE=$3; shift 3 ;;
    --build) BUILD=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

log() { print -P "%F{green}▸%f $*"; }

if [[ -n "$PAIR_PORT" ]]; then
  log "pairing with $DEVICE_IP:$PAIR_PORT"
  adb pair "$DEVICE_IP:$PAIR_PORT" "$PAIR_CODE"
fi

if ! adb devices | grep -q "^$DEVICE_IP:"; then
  log "scanning $DEVICE_IP for the wireless-debugging port (30000–49999)…"
  PORT=$(python3 - "$DEVICE_IP" <<'PY'
import asyncio, sys
host = sys.argv[1]
async def probe(p, sem):
    async with sem:
        try:
            _, w = await asyncio.wait_for(asyncio.open_connection(host, p), 4)
            w.close(); return p
        except Exception: return None
async def main():
    sem = asyncio.Semaphore(400)
    hits = [p for p in await asyncio.gather(*(probe(p, sem) for p in range(30000, 50000))) if p]
    print(hits[0] if hits else "")
asyncio.run(main())
PY
)
  [[ -n "$PORT" ]] || { echo "no open port found — is wireless debugging on and the overlay network up?" >&2; exit 1; }
  log "connecting to $DEVICE_IP:$PORT"
  adb connect "$DEVICE_IP:$PORT"
fi
SERIAL=$(adb devices | awk -v ip="$DEVICE_IP" '$1 ~ "^"ip {print $1}')
[[ -n "$SERIAL" ]] || { echo "device not attached" >&2; exit 1; }
export ANDROID_SERIAL=$SERIAL

if [[ $BUILD -eq 1 ]]; then
  log "building + installing dev client (expo run:android)"
  CI=1 npx expo run:android --no-bundler
fi

UPSTREAM=$(tailscale ip -4 2>/dev/null || /Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4 2>/dev/null || echo 127.0.0.1)
if ! lsof -nP -iTCP:$RELAY_PORT -sTCP:LISTEN >/dev/null; then
  log "relaying 127.0.0.1:$RELAY_PORT → $UPSTREAM:$METRO_PORT"
  nohup python3 - "$UPSTREAM" "$METRO_PORT" "$RELAY_PORT" > /tmp/android-remote-relay.log 2>&1 <<'PY' &
import asyncio, sys
up_host, up_port, listen = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
async def pipe(r, w):
    try:
        while data := await r.read(65536):
            w.write(data); await w.drain()
    except Exception: pass
    finally:
        try: w.close()
        except Exception: pass
async def handle(cr, cw):
    try: ur, uw = await asyncio.open_connection(up_host, up_port)
    except Exception: cw.close(); return
    await asyncio.gather(pipe(cr, uw), pipe(ur, cw))
async def main():
    srv = await asyncio.start_server(handle, '127.0.0.1', listen)
    async with srv: await srv.serve_forever()
asyncio.run(main())
PY
  sleep 1
fi
curl -sf -m 5 "http://127.0.0.1:$RELAY_PORT/status" | grep -q packager-status \
  || { echo "relay is up but Metro isn't answering — run \`pnpm start\` first" >&2; exit 1; }

log "adb reverse tcp:$METRO_PORT → tcp:$RELAY_PORT"
adb reverse "tcp:$METRO_PORT" "tcp:$RELAY_PORT"

log "launching dev client"
adb shell am force-stop "$PACKAGE"
adb shell am start -a android.intent.action.VIEW \
  -d "$SCHEME://expo-development-client/?url=http%3A%2F%2Flocalhost%3A$METRO_PORT" >/dev/null
log "done — the device loads its bundle from localhost:$METRO_PORT. Relay log: /tmp/android-remote-relay.log"
