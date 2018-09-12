#!/bin/sh
curl -X DELETE http://localhost:2368/ghost/api/v0.1/session --cookie cookies.txt \
  -H 'Origin: http://localhost:2368'
