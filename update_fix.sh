#!/bin/bash
# Copyright (c) 2026 Capitanul Alex pt BSH.
# Actualizam musicManager.js pentru redare fara cookies pe VPS Linux
sed -i 's/--audio-format", "webm/--audio-format", "best/g' utils/musicManager.js
sed -i 's/StreamType.WebmOpus/StreamType.Arbitrary/g' utils/musicManager.js
rm -f data/youtube_cookies.txt data/youtube_cookies.txt.txt youtube_cookies.txt cookies.txt
echo "Fisiere actualizate local. Restartam botul..."
pm2 delete phoenix-bot
pm2 start index.js --name "phoenix-bot"
pm2 logs phoenix-bot
