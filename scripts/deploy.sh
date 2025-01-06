#!/usr/bin/bash
set -xe
# This script deploys the app to the server
# using the 'zip-it and ship-it' strategy

# Required variables
WORK_DIR=/root/apps/geidelguerra-website

zip -r geidelguerra-website.zip .env src static .venv -x '**/*__pycache__/*'
scp geidelguerra-website.zip $SERVER_USER@$SERVER_HOST:/root/geidelguerra-website.zip
rm geidelguerra-website.zip

ssh -T "$SERVER_USER@$SERVER_HOST" << EOF
set -xe
mkdir -p $WORK_DIR
rm -rf $WORK_DIR-new
unzip /root/geidelguerra-website.zip -d $WORK_DIR-new
rm -rf $WORK_DIR
mv $WORK_DIR-new $WORK_DIR
cd $WORK_DIR
export PYTHONPATH=/root/apps/geidelguerra/.venv/lib/python3.11/site-packages
python3 src/cli.py gen-pdf
python3 src/cli.py generate-manifest
systemctl restart geidelguerra-website.service
EOF
