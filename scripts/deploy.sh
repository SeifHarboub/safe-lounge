#!/bin/sh
# Rebuilds the site for its sub-path and replaces the gh-pages branch with it.
# The branch holds only the built site; the sources stay on main.
set -e
BASE="${BASE_PATH:-/safe-lounge/}"
REPO=$(git config --get remote.origin.url)
ROOT=$(git rev-parse --show-toplevel)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

BASE_PATH="$BASE" npm run build
touch "$ROOT/dist/.nojekyll"
cp -R "$ROOT/dist/." "$WORK/"

cd "$WORK"
git init -q -b gh-pages
git config user.email "$(git -C "$ROOT" config user.email)"
git config user.name "$(git -C "$ROOT" config user.name)"
git add -A
git commit -q -m "Publication du site construit pour GitHub Pages"
git push -q --force "$REPO" gh-pages
echo "Publié sur https://seifharboub.github.io${BASE}"
