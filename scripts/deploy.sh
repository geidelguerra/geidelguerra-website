#!/usr/bin/bash

git push --force "ssh://$SERVER_USER@$SERVER_HOST$GIT_DIR_PATH"

ssh -T "$SERVER_USER@$SERVER_HOST" << EOF
mkdir -p $WORK_TREE_PATH
git --work-tree=$WORK_TREE_PATH --git-dir=$GIT_DIR_PATH checkout -f master
cd $WORK_TREE_PATH
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
supervisorctl restart geidelguerra-website
EOF