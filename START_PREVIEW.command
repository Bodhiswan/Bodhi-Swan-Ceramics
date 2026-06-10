#!/usr/bin/env bash
# Bodhi Swan Ceramics - local preview (macOS / Linux)
# Run:  ./start-preview.sh      (or double-click START_PREVIEW.command on Mac)
cd "$(dirname "$0")" || exit 1

PORT=8000
URL="http://localhost:$PORT"

echo "Starting local preview at $URL"
echo "Press Ctrl+C to stop."

# Open the browser shortly after the server starts.
( sleep 1
  if command -v open >/dev/null 2>&1; then open "$URL"        # macOS
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"  # Linux
  fi
) &

# Prefer python3, fall back to python.
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
else
  python -m http.server "$PORT"
fi
