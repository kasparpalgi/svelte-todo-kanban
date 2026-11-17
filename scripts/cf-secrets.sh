#!/usr/bin/env bash
# Upload the app's runtime secrets to the `todzz` Worker (#218, #254).
#   scripts/cf-secrets.sh .env.production
# Skips PUBLIC_* (inlined at build time, set in the deploy workflow), the Cloudflare deploy
# tokens, and Vercel's own build variables. Keeps CLOUDFARE_ACCOUNT_ID / _ACCESS_KEY_ID /
# _SECRET_ACCESS_KEY: uploads to the app's R2 bucket read them. Strips quotes, inline
# comments and stray \r. A `vercel env pull` writes "[SENSITIVE]" for a sensitive variable;
# the script refuses one, so take that value from .env instead.
set -euo pipefail
file="${1:?usage: scripts/cf-secrets.sh <env-file>}"

python3 - "$file" <<'EOF' | npx wrangler secret bulk
import json, re, sys
SKIP = ("PUBLIC_", "VERCEL", "TURBO_", "NX_")
DEPLOY = {"CLOUDFARE_API_TOKEN", "CLOUDFARE_FULL_ACCESS_API_TOKEN", "CLOUDFARE_S3_API_ENDPOINT", "DB_ENV"}
out = {}
for line in open(sys.argv[1], encoding="utf-8"):
    m = re.match(r'\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)', line.rstrip("\r\n"))
    if not m or m[1].startswith(SKIP) or m[1] in DEPLOY:
        continue
    v = m[2].strip()
    q = re.match(r'(["\'])(.*?)\1', v)
    v = q[2] if q else v.split(" #")[0].strip()
    if v == "[SENSITIVE]":
        sys.exit(f"{m[1]} is Vercel's [SENSITIVE] placeholder: put the real value in the file")
    out[m[1]] = v.replace("\r", "")
json.dump(out, sys.stdout)
EOF
