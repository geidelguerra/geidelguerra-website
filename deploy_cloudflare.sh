#!/bin/bash
set -euo pipefail

# Deploys the website as a Cloudflare Container (a Worker that proxies
# requests to the Go binary running inside a Docker container on
# Cloudflare's network). See cloudflare/ and README.md > Deployment >
# Cloudflare Containers for the full picture. For a plain VPS/SSH deploy
# instead, see deploy_ssh.sh.
#
# Requires: Node.js/npm, Docker (or a Docker-compatible engine) running
# locally, and a Cloudflare account on the Workers Paid plan with DOMAIN
# already added as an active Cloudflare zone (Containers/Custom Domains
# both require this).

CF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/cloudflare" && pwd)"

: "${DOMAIN:?DOMAIN environment variable must be set (e.g. DOMAIN=geidelguerra.com), and must already be an active Cloudflare zone}"

command -v npx >/dev/null 2>&1 || { echo "npx not found — install Node.js/npm first"; exit 1; }
command -v docker >/dev/null 2>&1 || echo "Warning: docker not found in PATH — 'wrangler deploy' needs a running Docker (or Docker-compatible) engine to build the container image."

if [ ! -d "$CF_DIR/node_modules" ]; then
    ( cd "$CF_DIR" && npm install )
fi

# Unlike gngtechservices-website's deploy_cloudflare.sh, this app has no
# secret or environment-specific runtime config (see main.go: only
# HOST/PORT, which the container sets itself in cloudflare/src/index.js),
# so cloudflare/wrangler.jsonc is deployed as-is — no generated temp
# config or `wrangler secret put` step needed.
( cd "$CF_DIR" && npx wrangler deploy --domain "$DOMAIN" )

echo "Deployed. On the very first deploy, Cloudflare can take a few minutes to provision the container image before https://$DOMAIN/ responds."
