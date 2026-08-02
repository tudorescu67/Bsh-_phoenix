# Phoenix Dashboard

Aplicatie simplă, gata pentru Vercel sau VPS, cu autentificare simulată prin Discord și control de permisiuni.

Versiune curentă: BSH 2.4.4

## Rulare local

1. Intră în folderul proiectului:
   - cd phoenix-dashboard-app
2. Rulează:
   - npm install
   - npm start
3. Deschide:
   - http://localhost:3000

## Deploy pe Vercel

1. Instalează Vercel CLI:
   - npm i -g vercel
2. Login:
   - vercel login
3. Din folderul proiectului:
   - vercel --prod

## Deploy pe VPS

1. Dă drepturi de execuție scriptului:
   - chmod +x deploy-vps.sh
2. Rulează:
   - ./deploy-vps.sh user@IP
   - exemplu: ./deploy-vps.sh root@185.203.118.214 /var/www/phoenix-dashboard

## Update rapid pe VPS (fără bot-core)

1. Din repo-ul de pe VPS rulezi:
   - chmod +x phoenix-dashboard-app/vps-update-dashboard-only.sh
   - ./phoenix-dashboard-app/vps-update-dashboard-only.sh /home/phoenix/Bsh-_phoenix

Scriptul face doar:
- git pull pe main
- npm ci în phoenix-dashboard-app
- restart la phoenix-dashboard-api și phoenix-dashboard
- nu atinge bot-core

## Ce include

- autentificare simulată prin Discord
- roluri: administrator, moderator, viewer
- permisiuni pentru editare și vizualizare
- panou de setări server
