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
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
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
