#!/usr/bin/bash

set -xe

git push --force "ssh://$SERVER_USER@$SERVER_HOST$GIT_DIR_PATH"

ssh -T "$SERVER_USER@$SERVER_HOST" << EOF
set -xe
mkdir -p $WORK_TREE_PATH
git --work-tree=$WORK_TREE_PATH --git-dir=$GIT_DIR_PATH checkout -f master
cd $WORK_TREE_PATH
rm -rf .venv
/root/.local/bin/poetry install --without dev
.venv/bin/python src/cli.py gen-pdf
supervisorctl restart geidelguerra-website
EOF