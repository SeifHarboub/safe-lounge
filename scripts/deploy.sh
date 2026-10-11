#!/bin/sh
# Rebuilds the site for lesafelounge.com and uploads it to the Infomaniak hosting
# (site lesafelounge.com of the « Nuage Burger » web hosting) over FTPS.
# The FTP user is restricted to /sites/lesafelounge.com; its password lives in the
# macOS Keychain (service infomaniak-ftp-lesafelounge), never in the repository.
set -e
BASE="${BASE_PATH:-/}"
export SITE_URL="${SITE_URL:-https://lesafelounge.com/}"
FTP_HOST="${FTP_HOST:-jj44wh.ftp.infomaniak.com}"
FTP_USER="${FTP_USER:-jj44wh_safelounge}"
FTP_PASS="${FTP_PASS:-$(security find-generic-password -s infomaniak-ftp-lesafelounge -w)}"
export FTP_PASS
ROOT=$(git rev-parse --show-toplevel)

BASE_PATH="$BASE" npm run build
python3 "$ROOT/scripts/ftps_upload.py" "$ROOT/dist" "$FTP_HOST" "$FTP_USER"
echo "Publié sur ${SITE_URL}"
