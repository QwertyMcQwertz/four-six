#!/bin/sh
# Run the tests, then copy the app to a server over rsync.
# Usage: deploy/deploy.sh user@host:/path/to/webroot/
set -e
dest="${1:-$DEPLOY_DEST}"
[ -n "$dest" ] || { echo "usage: $0 user@host:/path/  (or set DEPLOY_DEST)" >&2; exit 1; }
cd "$(dirname "$0")/.."
node test.js
rsync -av --delete app/ "$dest"
