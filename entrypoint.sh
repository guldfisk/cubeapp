#!/usr/bin/env bash

if [[ "$DEBUG" == "1" ]]
then
    python3 manage.py runserver 0.0.0.0:7000
else
    gunicorn --chdir cubeapp --bind :7000 cubeapp.wsgi:application
#    daphne -p -b localhost -p 7001 cubeapp.asgi:application
fi