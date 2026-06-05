# MVP Deployment

Produktionsziel:

- URL: `https://escape-game.example.com/`
- Reverse Proxy: Nginx Proxy Manager
- Auth-Schutz: bestehende Authelia-Regel auf `escape-game.example.com`
- App: Docker Compose Service `app`
- Datenbank: Docker Compose Service `postgres`
- Persistenz: Docker Volume `it-escape-game_postgres-data`

## Start/Update

```bash
cd /root/projects/it-escape-game
# .env muss existieren und darf nicht committed werden
docker compose -f docker-compose.yml -f deploy/docker-compose.mvp.yml up -d --build
```

## Stoppen

```bash
cd /root/projects/it-escape-game
docker compose -f docker-compose.yml -f deploy/docker-compose.mvp.yml down
```

## Datenbank zurücksetzen

Vorsicht: löscht alle Admin-Editor-Änderungen.

```bash
cd /root/projects/it-escape-game
docker compose -f docker-compose.yml -f deploy/docker-compose.mvp.yml down -v
docker compose -f docker-compose.yml -f deploy/docker-compose.mvp.yml up -d --build
```

Beim Neustart aus leerem Volume wird aus `src/data/*.json` neu geseedet.

## Reverse Proxy

Nginx Proxy Manager Proxy Host `escape-game.example.com` zeigt auf:

```text
forward_scheme: http
forward_host: it-escape-game-app-1
forward_port: 8080
certificate: escape-game.example.com
force SSL: enabled
```

Der App-Container ist über `deploy/docker-compose.mvp.yml` zusätzlich im externen Docker-Netzwerk `my-proxy-network`, damit NPM den Container per DNS-Namen erreichen kann.

## Lokaler Healthcheck auf dem Server

```bash
curl -fsS http://127.0.0.1:8094/api/health
```

Erwartung:

```json
{"ok":true}
```

## Öffentlicher Smoke-Test

Ohne Authelia-Session ist ein Redirect erwartbar:

```bash
curl -k -I https://escape-game.example.com/
```

Erwartung:

```text
HTTP/2 302
location: https://auth.example.com/?rd=https://escape-game.example.com/
```

## DB-Check

```bash
docker compose -f docker-compose.yml -f deploy/docker-compose.mvp.yml exec -T postgres \
  psql -U escape -d escape_game -c "select count(*) from stations;"
```

Erwartung im Seed-Zustand:

```text
8
```

## Secrets

`.env` enthält mindestens:

```text
APP_PORT=8094
POSTGRES_DB=escape_game
POSTGRES_USER=escape
POSTGRES_PASSWORD=...
ADMIN_PIN=...
```

Die Datei ist durch `.gitignore` vom Commit ausgeschlossen.
