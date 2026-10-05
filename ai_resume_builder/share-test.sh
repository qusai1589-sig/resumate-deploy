#!/usr/bin/env bash
# Run with: bash /games/ai_resume_builder/share-test.sh
set -euo pipefail

backend_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
frontend_dir="$(dirname -- "$backend_dir")/ResuMate-main"
python_bin="$(dirname -- "$backend_dir")/paddle-env/bin/python"
share_port="${RESUMATE_SHARE_PORT:-8001}"
tool_dir="$backend_dir/.share-tools"
backend_pid=""

cleanup() {
    if [[ -n "$backend_pid" ]]; then
        kill "$backend_pid" 2>/dev/null || true
        wait "$backend_pid" 2>/dev/null || true
    fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

if [[ ! -x "$python_bin" ]]; then
    echo "Backend Python environment missing: $python_bin" >&2
    exit 1
fi

if command -v cloudflared >/dev/null 2>&1; then
    tunnel_bin="$(command -v cloudflared)"
else
    case "$(uname -m)" in
        x86_64) tunnel_arch=amd64 ;;
        aarch64|arm64) tunnel_arch=arm64 ;;
        *) echo "Install cloudflared for your architecture first." >&2; exit 1 ;;
    esac
    mkdir -p "$tool_dir"
    tunnel_bin="$tool_dir/cloudflared"
    if [[ ! -x "$tunnel_bin" ]]; then
        echo "Downloading Cloudflare's tunnel tool from its official release..."
        curl --fail --location --silent --show-error \
            "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$tunnel_arch" \
            --output "$tool_dir/cloudflared.download"
        chmod 700 "$tool_dir/cloudflared.download"
        mv "$tool_dir/cloudflared.download" "$tunnel_bin"
    fi
fi

echo "Building the website for sharing..."
(cd "$frontend_dir" && VITE_API_BASE_URL=/api npm run build)

# Check availability before starting so an unrelated server is never shared.
"$python_bin" - "$share_port" <<'PY'
import socket
import sys
with socket.socket() as listener:
    listener.bind(("127.0.0.1", int(sys.argv[1])))
PY

cd "$backend_dir"
"$python_bin" -m uvicorn share_app:app --host 127.0.0.1 --port "$share_port" &
backend_pid=$!

ready=false
for attempt in $(seq 1 120); do
    if ! kill -0 "$backend_pid" 2>/dev/null; then
        echo "Backend stopped before it was ready." >&2
        exit 1
    fi
    if curl --fail --silent --output /dev/null "http://127.0.0.1:$share_port/"; then
        ready=true
        break
    fi
    sleep 1
done
if [[ "$ready" != true ]]; then
    echo "Backend did not start within two minutes." >&2
    exit 1
fi

echo "Send your friend the https://...trycloudflare.com URL printed below."
echo "Keep this terminal open. Press Ctrl+C to stop sharing."
"$tunnel_bin" tunnel --url "http://127.0.0.1:$share_port" --no-autoupdate
