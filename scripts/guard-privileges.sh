#!/usr/bin/env bash
set -euo pipefail

# scripts/guard-privileges.sh
# Fail CI or local script if dangerous grant patterns are found in the repo.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[guard] scanning for forbidden privilege statements..."

# Disallow granting or inheriting the 'postgres' role (exclude comments)
if grep -RInE '^[[:space:]]*GRANT[[:space:]]+postgres\b|^[[:space:]]*IN[[:space:]]+ROLE[[:space:]]+postgres\b' "$ROOT_DIR" >/dev/null 2>&1; then
  echo "[guard] Forbidden pattern detected: attempt to grant or inherit the 'postgres' role."
  echo "[guard] Remove any such grants. On managed Postgres, this will always fail."
  exit 1
fi

echo "[guard] OK: no forbidden privilege statements found."