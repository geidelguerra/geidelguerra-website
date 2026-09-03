#!/bin/bash
set -euo pipefail

APP_NAME="geidelguerra-website"
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
# If deployed behind a reverse proxy/CDN that sets X-Forwarded-Proto (nginx
# itself only listens on port 80, so its own \$scheme is always "http"),
# trust that header for the visitor's real scheme. Falls back to nginx's
# own \$scheme if the header is ever missing, e.g. a direct request.
map \$http_x_forwarded_proto \$origin_scheme {
    default \$http_x_forwarded_proto;
    ""      \$scheme;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Scoped to this server block (not the top-level http context) since
    # the system's nginx.conf commonly already sets "gzip on;" globally
    # (e.g. Debian/Ubuntu's default), and repeating it at the same context
    # nginx.conf's own http block uses is a duplicate-directive error, not
    # a harmless override. Nested here, it's simply this server's own
    # setting instead.
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Long-lived, cacheable static assets: let any CDN/edge in front and
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

    # Everything else (the page, /data.json, /cv.pdf): avoid a CDN/edge or
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
