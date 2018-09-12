#!/bin/sh
curl http://localhost:2368/ghost/api/v0.1/session --cookie cookies.txt \
  -H 'Origin: http://localhost:2368' \
  -H 'Referrer: http://localhost:2368/delete-me-or-the-one-above/but-not-both' \
  | jq .
