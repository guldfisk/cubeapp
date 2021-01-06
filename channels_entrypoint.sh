#!/usr/bin/env bash

USE_PICKLE_DB=1 daphne -b 0.0.0.0 -p 7001 cubeapp.asgi:application