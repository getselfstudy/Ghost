#!/bin/sh
curl http://localhost:2368/ghost/api/v0.1/session --cookie cookies.txt | jq .
