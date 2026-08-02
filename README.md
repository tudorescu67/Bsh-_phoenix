<!-- by Capitanul burcea,alex -->
# Discord Bot - Phoenix Risen

## Setup rapid

1. Copiaza `.env.example` in `.env` si completeaza token-ul botului.
2. Ruleaza `npm install`.
3. Ruleaza `node deploy-commands.js` o singura data sau cand adaugi/modifici comenzi slash.
4. Porneste botul cu `node index.js` sau `pm2 start ecosystem.config.js`.

## Ubuntu VPS - dependinte audio

```bash
sudo apt update
sudo apt install -y ffmpeg python3 python3-pip python3-venv build-essential git
python3 -m pip install -U yt-dlp discord.py PyNaCl
npm install
npm run deploy
pm2 start ecosystem.config.js
```

Setari utile in `.env`:

```env
MUSIC_CACHE_DIR=/opt/bsh-stack/music-cache/phoenix
MUSIC_LIBRARY_DIR=/opt/bsh-stack/music-library
MUSIC_BACKGROUND_CACHE=true
MUSIC_STREAM_TIMEOUT_MS=12000
MUSIC_MATCH_THRESHOLD=45
INVITE_FAKE_ACCOUNT_DAYS=3
```

Muzica ruleaza fara cookies si fara API extern. Ordinea de fallback este: stream direct / yt-dlp cu IPv6 si user-agent mobil, SoundCloud, apoi biblioteca locala. Daca potrivirea titlului este slaba, botul refuza rezultatul ca sa nu redea melodia gresita.

## AI Integration

Comanda `/ai` suporta:
- `OpenAI API` - foloseste direct API-ul OpenAI, fara Chrome/Puppeteer.
- `Ollama Local` - foloseste un server Ollama local.
- `DuckDuckGo AI Browser`, `Claude via DuckDuckGo`, `Gemini via DuckDuckGo` - folosesc Puppeteer si au nevoie de Chrome/Chromium deja instalat pe server.
- `Auto` - incearca in ordine: OpenAI, Ollama, apoi browser.

Variabile pentru OpenAI in `.env`:

```env
OPENAI_API_KEY=cheia_ta_openai
OPENAI_MODEL=gpt-4o-mini
```

Pentru servere mici este recomandat sa folosesti Chromium deja instalat in sistem, nu browserul descarcat automat la `npm install`:

```bash
sudo apt-get update
sudo apt-get install -y chromium
```

Alternativ, poti lasa providerii prin browser dezactivati si sa folosesti doar OpenAI sau Ollama.

Daca folosesti Chromium instalat deja pe server:

```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

Dupa modificarea optiunilor slash command:

```bash
node deploy-commands.js
pm2 restart phoenix-bot
```

## Performance

Botul foloseste cache pentru fisierele JSON din `data/`, astfel comenzile si sistemele de XP/economy nu mai citesc de pe disk la fiecare mesaj. Poti regla delay-ul de salvare in `.env`:

```env
DB_WRITE_DELAY_MS=750
GLOBAL_ERROR_LOG_COOLDOWN_MS=60000
```

Pentru verificari rapide foloseste `/bot health`.

## RCON

Comanda `/rcon send` trimite comenzi catre consola serverului fara sa mai intri pe VPS prin PuTTY.

1. Activeaza RCON in serverul jocului.
2. Completeaza in `.env`:

```env
RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=parola_rcon_aici
RCON_TIMEOUT_MS=5000
# Optional, pentru acces doar pe un rol:
# RCON_ALLOWED_ROLE_ID=id_rol_aici
```

3. Ruleaza:

```bash
node deploy-commands.js
pm2 restart phoenix-bot
```

## Sistem Logs - Comenzi

| Comanda | Descriere |
| --- | --- |
| `/logs setup #canal` | Seteaza canalul principal pentru toate log-urile |
| `/logs canal moderation #canal` | Canal separat pentru moderare |
| `/logs canal members #canal` | Canal separat pentru join/leave |
| `/logs canal messages #canal` | Canal separat pentru mesaje sterse/editate |
| `/logs canal voice #canal` | Canal separat pentru voce |
| `/logs canal server #canal` | Canal separat pentru canale/roluri |
| `/logs canal tickets #canal` | Canal separat pentru tickete |
| `/logs disable <tip>` | Dezactiveaza un tip de log |
| `/logs enable <tip>` | Reactiveaza un tip de log |
| `/logs status` | Afiseaza configuratia curenta |
| `/logs reset` | Reseteaza toata configuratia |

## Sisteme Automate

- Moderare: `/ban`, `/unban`, `/kick`, `/warn`, `/timeout`, `/clear`, `/lock`.
- Logs: mesaje sterse/editate, join/leave, roluri, canale, voice, tickete.
- Ticket system cu categorii, claim, add/remove member si transcript HTML.
- Apply system cu formular si butoane accept/deny.
- Voice temporar cu panou de control.
- Self roles, verify, welcome, stats si panouri interactive.
- Music player cu queue, now playing, volume, loop si radio.

## Intents Necesare

Activeaza in Discord Developer Portal:
- Presence Intent
- Server Members Intent
- Message Content Intent
- Server Invites Intent / Guild Invites pentru invite tracker

## Structura

```text
commands/
  fun/
  moderation/
  music/
  utility/
  vc/
events/
utils/
data/
index.js
deploy-commands.js
```

## Welcome cu poza/GIF si rama

Comanda:

```text
/welcome setup canal:#welcome imagine:https://.../welcome.gif rama:#D4AF37 card:true
```

Mesajul poate folosi:

```text
{user} {username} {tag} {server} {memberCount} {inviter} {inviterName} {inviteCount}
```

Pentru muzica stabila pe VPS:

```env
MUSIC_STABLE_MODE=true
MUSIC_DEFAULT_VOLUME=85
MUSIC_MAX_CACHE_MB=20480
```
