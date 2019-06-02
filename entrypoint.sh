#!/bin/sh

#cd /home/app
pip3 install -r requirements.txt

python3 -m mtgorp.db.init

cp -r /code/appdirs/* /root/.local/share/

python3 manage.py migrate
python3 manage.py populatecubes

apt-get update
curl -sL https://deb.nodesource.com/setup_10.x -o /tmp/nodesource_setup.sh
bash /tmp/nodesource_setup.sh
apt install nodejs

npm install dev
npm run dev

python3 manage.py collectstatic --noinput

exec "$@"