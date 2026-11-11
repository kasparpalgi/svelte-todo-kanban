#!/usr/bin/env bash
# Upload the app's runtime secrets to the `todzz` Worker (#218).
#   scripts/cf-secrets.sh .env.production
# Skips PUBLIC_* (inlined at build time, set in the deploy workflow) and CLOUDFARE_*
# (deploy credentials, not app config). Strips quotes, inline comments and stray \r.
set -euo pipefail
file="${1:?usage: scripts/cf-secrets.sh <env-file>}"

python3 - "$file" <<'EOF' | npx wrangler secret bulk
import json, re, sys
out = {}
for line in open(sys.argv[1], encoding="utf-8"):
    m = re.match(r'\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)', line.rstrip("\r\n"))
    if not m or m[1].startswith(("PUBLIC_", "CLOUDFARE_")):
        continue
    v = m[2].strip()
    q = re.match(r'(["\'])(.*?)\1', v)
    v = q[2] if q else v.split(" #")[0].strip()
    out[m[1]] = v.replace("\r", "")
json.dump(out, sys.stdout)
EOF
