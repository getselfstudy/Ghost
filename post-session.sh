#!/bin/sh
curl http://localhost:2368/ghost/api/v0.1/session -H 'Content-Type: application/json' \
    --data "{\"username\": \"$1\", \"password\": \"$2\"}" --cookie-jar cookies.txt \
    -H 'Origin: http://localhost:2368'

