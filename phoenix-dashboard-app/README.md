# Phoenix Dashboard

Aplicatie simplă, gata pentru Vercel sau VPS, cu autentificare simulată prin Discord și control de permisiuni.

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

## Ce include

- autentificare simulată prin Discord
- roluri: administrator, moderator, viewer
- permisiuni pentru editare și vizualizare
- panou de setări server
