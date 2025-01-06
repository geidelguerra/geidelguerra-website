#!/usr/bin/bash
set -xe
# This script deploys the app to the server
# using the 'zip-it and ship-it' strategy

# Required variables
APP_NAME=geidelguerra-website
APP_DIR=/apps/$APP_NAME

zip -r $APP_NAME.zip .env src static .venv -x '**/*__pycache__/*'
scp $APP_NAME.zip $SERVER_USER@$SERVER_HOST:$APP_NAME.zip
rm $APP_NAME.zip

ssh -T "$SERVER_USER@$SERVER_HOST" << EOF
set -xe
mkdir -p $APP_DIR/current
rm -rf $APP_DIR/new
unzip $APP_NAME.zip -d $APP_DIR/new
chown -R root:www-data $APP_DIR/new
rm -rf $APP_DIR/current
mv $APP_DIR/new $APP_DIR/current
cd $APP_DIR/current
export PYTHONPATH=$APP_DIR/current/.venv/lib/python3.11/site-packages
python3 src/cli.py gen-pdf
python3 src/cli.py generate-manifest
systemctl restart $APP_NAME.service
EOF
