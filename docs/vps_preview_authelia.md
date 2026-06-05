# VPS-Preview hinter Authelia

## Aktuelle URL

```text
https://preview.example.com/
```

Diese vorhandene, ungenutzte Subdomain ist aktuell als geschützte Preview für das IT-Escape-Game konfiguriert.

## Laufende Komponenten

### Static App Container

Container:

```text
it-escape-game-web
```

Image:

```text
nginx:1.27-alpine
```

Docker-Netzwerk:

```text
my-proxy-network
```

Der Container mountet das Projekt read-only:

```text
/root/projects/it-escape-game -> /usr/share/nginx/html
```

Nginx-Config im Container:

```text
/root/projects/it-escape-game/deploy/nginx.conf
```

Compose-Datei für spätere Reproduktion:

```text
/root/projects/it-escape-game/docker-compose.yml
```

Start/Update:

```bash
cd /root/projects/it-escape-game
docker compose up -d
```

## Nginx Proxy Manager

NPM-Proxy-Host:

```text
preview.example.com
```

Forward-Ziel:

```text
http://it-escape-game-web:80
```

Authelia ist über `auth_request` aktiv. Nicht eingeloggte Requests bekommen einen Redirect auf:

```text
https://auth.example.com/?rd=https://preview.example.com/
```

Wichtig: Für die schnelle Preview wurde zusätzlich eine manuelle NPM-Proxy-Host-Datei erstellt:

```text
/root/nginx-proxy-manager/data/nginx/proxy_host/26.conf
```

Sie nutzt das bestehende Let's-Encrypt-Zertifikat:

```text
/etc/letsencrypt/live/npm-33/fullchain.pem
/etc/letsencrypt/live/npm-33/privkey.pem
```

Vorher wurde die NPM-Datenbank gesichert unter:

```text
/root/nginx-proxy-manager/data/backups/database.sqlite.before-it-escape-<timestamp>
```

## Verifikation

```bash
docker ps --filter name=it-escape-game-web

docker exec it-escape-game-web wget -qO- http://127.0.0.1/src/ | grep '<title>'

docker exec nginx-proxy-manager-app-1 nginx -t

curl -I https://preview.example.com/
```

Erwartung ohne Authelia-Session:

```text
HTTP/2 302
location: https://auth.example.com/?rd=https://preview.example.com/
```

Nach Login über Authelia sollte die App erreichbar sein.

## Später sauber machen

Für einen finalen dauerhaften Betrieb sollten wir eine eigene Subdomain setzen, z. B.:

```text
escape-game.example.com
```

Dafür braucht es einen DNS-A-Record auf die VPS-IP und anschließend einen eigenen NPM Proxy Host mit Let's-Encrypt-Zertifikat. Bis dahin nutzt die Preview bewusst die vorhandene, bereits zertifizierte Subdomain `preview.example.com`.
