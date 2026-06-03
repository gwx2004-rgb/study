#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "$DIR/scripts/yolo-server/start.sh"
