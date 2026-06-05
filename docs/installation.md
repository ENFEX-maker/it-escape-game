# Installation

Diese Anleitung beschreibt die Standardinstallation des IT-Escape-Games mit Docker Compose und PostgreSQL.

## Voraussetzungen

- Linux-Server oder lokaler Rechner mit Docker und Docker Compose Plugin
- GitHub-Zugriff auf dieses private Repository
- freier Port für die Web-App, standardmäßig `8080`

## Repository klonen

```bash
git clone https://github.com/ENFEX-maker/it-escape-game.git
cd it-escape-game
```

Falls der Repository-Name später geändert wird, den GitHub-Link entsprechend ersetzen.

## Konfiguration

```bash
cp .env.example .env
```

Danach `.env` bearbeiten:

```text
APP_PORT=8080
POSTGRES_DB=escape_game
POSTGRES_USER=escape
POSTGRES_PASSWORD=<starkes-passwort-setzen>
ADMIN_PIN=<eigene-admin-pin-setzen>
```

Wichtig:

- `.env` niemals committen oder weitergeben.
- `POSTGRES_PASSWORD` muss individuell gesetzt werden.
- `ADMIN_PIN` schützt den Spielleiter-/Admin-Editor-Modus innerhalb der App.

## Start

```bash
docker compose up -d --build
```

Danach öffnen:

```text
http://localhost:8080/
```

Wenn `APP_PORT` geändert wurde, entsprechend den anderen Port öffnen.

## Healthcheck

```bash
curl http://localhost:8080/api/health
```

Erwartung:

```json
{"ok":true}
```

## Logs

```bash
docker compose logs -f app
```

## Stoppen

```bash
docker compose down
```

## Datenbank und Persistenz

Die App legt beim ersten Start automatisch das PostgreSQL-Schema an und importiert die Inhalte aus `src/data/*.json`.

Danach ist PostgreSQL die führende Datenquelle für Änderungen aus dem Admin-Editor.

Die Datenbankdaten liegen im Docker-Volume:

```text
it-escape-game_postgres-data
```

## Komplett zurücksetzen

Vorsicht: löscht alle Editor-Änderungen.

```bash
docker compose down -v
docker compose up -d --build
```

Danach wird wieder aus den JSON-Dateien geseedet.

## Admin-Editor

1. Spiel öffnen.
2. Spielleiter-Modus öffnen.
3. `ADMIN_PIN` eingeben.
4. Admin-Editor öffnen.
5. Inhalte bearbeiten und speichern.

Im Docker-/PostgreSQL-Betrieb werden Änderungen serverseitig gespeichert und sind danach für alle Geräte sichtbar.

## Statischer Fallback ohne Datenbank

Für einfache lokale Vorschau ohne DB:

```bash
python3 -m http.server 8080
```

Dann öffnen:

```text
http://localhost:8080/src/
```

In diesem Modus werden Admin-Änderungen nur im Browser gespeichert und nicht in PostgreSQL persistiert.
