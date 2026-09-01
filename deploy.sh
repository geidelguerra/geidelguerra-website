#!/bin/bash
set -euo pipefail

APP_NAME="website"
BIN_NAME="website"
BIN_PATH="./bin/$BIN_NAME"
REMOTE_TEMP_BIN_PATH="/tmp/$BIN_NAME"
REMOTE_APP_DIR="/apps/$APP_NAME"
REMOTE_BIN_PATH="$REMOTE_APP_DIR/$BIN_NAME"

SERVICE_USER=website
SERVICE_GROUP=website

PORT=8080
SERVICE_BIN_PATH="$REMOTE_BIN_PATH"
SERVICE_WORK_DIR="$REMOTE_APP_DIR"
SERVICE_ADDR=":$PORT"
REMOTE_SERVICE_FILENAME="$APP_NAME.service"
REMOTE_TEMP_SERVICE_PATH="/tmp/$REMOTE_SERVICE_FILENAME"
REMOTE_SERVICE_PATH="/etc/systemd/system/$REMOTE_SERVICE_FILENAME"

REMOTE_NGINX_FILENAME="$APP_NAME.conf"
REMOTE_TEMP_NGINX_PATH="/tmp/$REMOTE_NGINX_FILENAME"
REMOTE_NGINX_PATH="/etc/nginx/conf.d/$REMOTE_NGINX_FILENAME"

# Cloudflare's published IP ranges (https://www.cloudflare.com/ips/). Used
# below to (1) restore the real visitor IP from the CF-Connecting-IP header
# and (2) restrict direct access to the origin to Cloudflare + localhost, so
# Cloudflare's cache/WAF can't be bypassed by hitting the server's IP
# directly. Update this list if Cloudflare changes their ranges.
CLOUDFLARE_IPS=(
    173.245.48.0/20
    103.21.244.0/22
    103.22.200.0/22
    103.31.4.0/22
    141.101.64.0/18
    108.162.192.0/18
    190.93.240.0/20
    188.114.96.0/20
    197.234.240.0/22
    198.41.128.0/17
    162.158.0.0/15
    104.16.0.0/13
    104.24.0.0/14
    172.64.0.0/13
    131.0.72.0/22
    2400:cb00::/32
    2606:4700::/32
    2803:f800::/32
    2405:b500::/32
    2405:8100::/32
    2a06:98c0::/29
    2c0f:f248::/32
)

CLOUDFLARE_REAL_IP_DIRECTIVES=""
CLOUDFLARE_ALLOW_DIRECTIVES=""
for ip in "${CLOUDFLARE_IPS[@]}"; do
    CLOUDFLARE_REAL_IP_DIRECTIVES+="set_real_ip_from $ip;"$'\n'
    CLOUDFLARE_ALLOW_DIRECTIVES+="    allow $ip;"$'\n'
done

: "${SERVER:?SERVER environment variable must be set}"
: "${DOMAIN:?DOMAIN environment variable must be set (e.g. DOMAIN=geidelguerra.com)}"

[ -f "$BIN_PATH" ] || { echo "Binary not found: $BIN_PATH (run 'task build' first)"; exit 1; }

# Config files are rendered to local temp files, then scp'd verbatim to the
# server. This avoids passing their content through the ssh heredoc below,
# which would double-expand nginx's own $host/$scheme/etc. variables as if
# they were (unset) shell variables.
LOCAL_TEMP_SERVICE_PATH=$(mktemp)
LOCAL_TEMP_NGINX_PATH=$(mktemp)
trap 'rm -f "$LOCAL_TEMP_SERVICE_PATH" "$LOCAL_TEMP_NGINX_PATH"' EXIT

cat > "$LOCAL_TEMP_SERVICE_PATH" << EOF
[Unit]
Description=Website
After=network.target

[Service]
ExecStart=$SERVICE_BIN_PATH serve -addr $SERVICE_ADDR
Restart=always
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=3
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$SERVICE_WORK_DIR

[Install]
WantedBy=multi-user.target
EOF

cat > "$LOCAL_TEMP_NGINX_PATH" << EOF
# --- Cloudflare integration --------------------------------------------
# Trust CF-Connecting-IP only when the connection actually comes from a
# Cloudflare IP, so \$remote_addr reflects the real visitor instead of
# Cloudflare's edge node.
$CLOUDFLARE_REAL_IP_DIRECTIVES
real_ip_header CF-Connecting-IP;
real_ip_recursive on;

# Cloudflare forwards the visitor's real scheme via X-Forwarded-Proto
# (nginx's own \$scheme here is always "http", since we only listen on
# port 80). Fall back to \$scheme if that header is ever missing, e.g. a
# direct, non-Cloudflare request.
map \$http_x_forwarded_proto \$origin_scheme {
    default \$http_x_forwarded_proto;
    ""      \$scheme;
}

gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 5;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Only Cloudflare (and localhost, for local health checks) may reach
    # this origin directly, so Cloudflare's cache/WAF can't be bypassed by
    # hitting the server's IP. Remove this allow/deny block if you need
    # direct, non-Cloudflare access to this host.
$CLOUDFLARE_ALLOW_DIRECTIVES
    allow 127.0.0.1;
    allow ::1;
    deny all;

    # Long-lived, cacheable static assets: let Cloudflare's edge and
    # visitors' browsers cache these aggressively.
    location /static/ {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$origin_scheme;
        add_header Cache-Control "public, max-age=2592000, immutable" always;
    }

    location = /favicon.ico {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$origin_scheme;
        add_header Cache-Control "public, max-age=2592000, immutable" always;
    }

    # Everything else (the page, /data.json, /cv.pdf): avoid Cloudflare or
    # browsers caching stale content after a redeploy without a purge.
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$origin_scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        add_header Cache-Control "no-cache" always;
    }
}
EOF

scp "$BIN_PATH" "$SERVER:$REMOTE_TEMP_BIN_PATH"
scp "$LOCAL_TEMP_SERVICE_PATH" "$SERVER:$REMOTE_TEMP_SERVICE_PATH"
scp "$LOCAL_TEMP_NGINX_PATH" "$SERVER:$REMOTE_TEMP_NGINX_PATH"

ssh -T "$SERVER" << EOF
if ! id -u "$SERVICE_USER" >/dev/null 2>&1; then
    useradd -m -s /bin/bash "$SERVICE_USER"
fi
if ! getent group "$SERVICE_GROUP" >/dev/null 2>&1; then
    groupadd "$SERVICE_GROUP"
fi
usermod -a -G "$SERVICE_GROUP" "$SERVICE_USER"
mkdir -p "$REMOTE_APP_DIR"
mv -f "$REMOTE_TEMP_BIN_PATH" "$REMOTE_BIN_PATH"
chmod +x "$REMOTE_BIN_PATH"
chown -R "$SERVICE_USER:$SERVICE_GROUP" "$REMOTE_APP_DIR"

mv -f "$REMOTE_TEMP_SERVICE_PATH" "$REMOTE_SERVICE_PATH"
systemctl daemon-reload
systemctl enable "$REMOTE_SERVICE_FILENAME"
systemctl restart "$REMOTE_SERVICE_FILENAME"

if ! command -v nginx >/dev/null 2>&1; then
    apt-get update
    apt-get install -y nginx
fi
mkdir -p /etc/nginx/conf.d
mv -f "$REMOTE_TEMP_NGINX_PATH" "$REMOTE_NGINX_PATH"
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx
EOF
