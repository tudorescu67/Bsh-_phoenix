<!-- by Capitanul burcea,alex -->
# BSH Jarvis VC Assistant

Asistent vocal pentru Discord VC. Adminul ruleaza `/jarvisvc join`, botul intra in voice channel, asculta utilizatorii, trimite intrebarea la Jarvis API si raspunde vocal in acelasi VC.

## Comenzi Discord

```text
/jarvisvc join
/jarvisvc join force:true
/jarvisvc status
/jarvisvc leave
```

`force:true` opreste muzica activa inainte sa porneasca Jarvis VC.

## Instalare rapida pe Contabo Ubuntu

```bash
sudo apt update
sudo apt install -y ffmpeg espeak-ng build-essential cmake git

cd "/opt/bsh-stack/update phoenix"
npm install
npm run deploy
pm2 restart phoenix-bot --update-env
```

## Variabile minime

```env
JARVIS_API_URL=http://127.0.0.1:5055
JARVIS_API_TOKEN=schimba-tokenul
JARVIS_VOICE_ENABLED=true
JARVIS_VOICE_LANGUAGE=ro
JARVIS_VOICE_TEXT_LOG=true
JARVIS_VOICE_WAKE_REQUIRED=false
JARVIS_VOICE_WAKE_WORDS=jarvis,gervis,bsh
JARVIS_VOICE_OUTPUT_VOLUME=0.8
JARVIS_VOICE_EFFECTS_ENABLED=true
JARVIS_VOICE_EFFECT_PRESET=warm-human
```

Cu doar `espeak-ng`, botul poate vorbi, dar inca are nevoie de STT ca sa inteleaga vocea.

## Voce naturala si efecte

Preseturi incluse:

```env
JARVIS_VOICE_EFFECT_PRESET=warm-human
```

Valori recomandate:

```text
clean
warm-human
radio
club
deep-bass
space-reverb
```

Pentru control manual:

```env
JARVIS_VOICE_FFMPEG_FILTER=highpass=f=75,lowpass=f=13500,bass=g=3:f=115:w=0.6,acompressor=threshold=-18dB:ratio=2.3,loudnorm=I=-16:TP=-1.5:LRA=11
```

Pentru profil vocal personal, foloseste doar sample-uri proprii sau cu acord explicit:

```env
JARVIS_VOICE_PROFILE_ID=profilul_tau_din_provider
JARVIS_VOICE_PROFILE_CONSENT=true
JARVIS_VOICE_TTS_STYLE=natural, warm, human, radio-ready
```

Optional, ca Jarvis sa intre singur in VC dupa restart PM2:

```env
JARVIS_VOICE_AUTO_CHANNEL_ID=ID_CANAL_VOICE
JARVIS_VOICE_AUTO_TEXT_CHANNEL_ID=ID_CANAL_TEXT_LOGURI
JARVIS_VOICE_AUTO_JOIN_DELAY_MS=8000
```

## STT local cu whisper.cpp

```bash
sudo mkdir -p /opt/bsh
sudo chown -R "$USER":"$USER" /opt/bsh
cd /opt/bsh
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
cmake -B build
cmake --build build -j"$(nproc)"
bash ./models/download-ggml-model.sh small
```

Adauga in `.env`:

```env
JARVIS_VOICE_STT_COMMAND=/opt/bsh/whisper.cpp/build/bin/whisper-cli
JARVIS_VOICE_STT_ARGS=-m /opt/bsh/whisper.cpp/models/ggml-small.bin -l ro -f {file} -otxt -of {base}
JARVIS_VOICE_STT_OUTPUT={base}.txt
```

Daca binarul se numeste `main` pe versiunea instalata:

```env
JARVIS_VOICE_STT_COMMAND=/opt/bsh/whisper.cpp/build/bin/main
```

## STT/TTS prin API extern

```env
JARVIS_VOICE_STT_URL=http://127.0.0.1:5060/transcribe
JARVIS_VOICE_STT_TOKEN=optional
JARVIS_VOICE_TTS_URL=http://127.0.0.1:5060/speak
JARVIS_VOICE_TTS_TOKEN=optional
```

Endpointul STT trebuie sa accepte multipart `audio` si sa returneze `text` sau `transcript`.
Endpointul TTS trebuie sa primeasca JSON `{ "text": "...", "voice": "...", "language": "ro" }` si sa returneze audio `mp3/wav`.

## OpenAI fallback optional

```env
OPENAI_API_KEY=sk-...
OPENAI_TRANSCRIBE_MODEL=whisper-1
OPENAI_TTS_MODEL=tts-1
OPENAI_TTS_VOICE=onyx
```

## Recomandari VPS

- Ruleaza Jarvis API local pe `127.0.0.1:5055`.
- Tine `JARVIS_API_TOKEN` setat si identic in bot + Jarvis API.
- Daca VC-ul raspunde prea des, seteaza `JARVIS_VOICE_WAKE_REQUIRED=true`.
- Daca taie propozitiile prea repede, mareste `JARVIS_VOICE_SILENCE_MS=1300`.
- Daca raspunsurile sunt prea lungi pentru voce, seteaza `JARVIS_VOICE_TTS_MAX_CHARS=900`.
