#!/usr/bin/sh
# This scripts installs and set up the server

# Required variables
# SERVER_USER=
# SERVER_HOST=
set -xe

scp scripts/nginx.conf $SERVER_USER@$SERVER_HOST:/root/geidelguerra-website.nginx.conf
scp scripts/systemd.service $SERVER_USER@$SERVER_HOST:/root/geidelguerra-website.service

ssh -T "$SERVER_USER@$SERVER_HOST" << EOF
apt update && apt install -y nginx unzip
mv /root/geidelguerra-website.nginx.conf /etc/nginx/conf.d/geidelguerra-website.conf
mv /root/geidelguerra-website.service /etc/systemd/system/geidelguerra-website.service
systemctl daemon-reload
systemctl enable geidelguerra-website.service
systemctl restart geidelguerra-website.service
systemctl enable nginx
systemctl restart nginx
EOF
