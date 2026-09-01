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

SERVICE_BIN_PATH="$REMOTE_BIN_PATH"
SERVICE_WORK_DIR="$REMOTE_APP_DIR"
SERVICE_ADDR=":8080"
REMOTE_SERVICE_FILENAME="$APP_NAME.service"
REMOTE_SERVICE_PATH="/etc/systemd/system/$REMOTE_SERVICE_FILENAME"

: "${SERVER:?SERVER environment variable must be set}"

[ -f "$BIN_PATH" ] || { echo "Binary not found: $BIN_PATH (run 'task build' first)"; exit 1; }

SERVICE_FILE_CONTENT=$(cat << EOF
[Unit]
Description=Geidel Guerra Website
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
)

scp "$BIN_PATH" "$SERVER:$REMOTE_TEMP_BIN_PATH"

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
echo "$SERVICE_FILE_CONTENT" | tee "$REMOTE_SERVICE_PATH" > /dev/null
systemctl daemon-reload
systemctl enable "$REMOTE_SERVICE_FILENAME"
systemctl restart "$REMOTE_SERVICE_FILENAME"
EOF
