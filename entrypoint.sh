#!/usr/bin/env bash

if [[ "$DEBUG" == "1" ]]
then
    IMAGE_CACHE_SIZE=32 USE_PICKLE_DB=1 python3 manage.py runserver 0.0.0.0:7000
else
    IMAGE_CACHE_SIZE=32 USE_PICKLE_DB=1 gunicorn --chdir cubeapp --bind :7000 cubeapp.wsgi:application
fi