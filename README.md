# Azubi-Einsatz: Der Ransomware-Alarm

Ein kleines, eigenständiges IT-Escape-Game für Schüler*innen zur Berufsorientierung und IT-Security-Awareness.

Die Teilnehmenden übernehmen die Rolle eines Junior-IT-Teams und bearbeiten einen fiktiven Ransomware-Vorfall bei der Beton-Palast Junior GmbH. Durch Aufgaben zu Phishing, Links, Logs, Sofortmaßnahmen, Backups, Netzwerkisolation, Accounts und Codierung sammeln sie dreistellige Codes.

## Status

MVP im Aufbau.

## Zielgruppe

Schüler*innen ab ca. 14 Jahren, Praktikumsgruppen, Ausbildungsmessen, Tag der offenen Tür und interne Recruiting-Veranstaltungen.

## Spielzeit

- Kurzvariante: ca. 45 Minuten mit 5–6 Stationen
- Standard: ca. 60 Minuten mit 6 Stationen
- Langvariante: 75 Minuten mit Bonusstationen 7–8

## Technischer Ansatz

Self-hostbare Web-App mit optionalem statischem Fallback:

- Node.js/Express Backend
- PostgreSQL als persistente Datenbank für Admin-Editor-Inhalte
- statisches Frontend aus `src/`
- JSON-Dateien bleiben als Seed/Fallback erhalten
- Docker Compose für App + Datenbank
- lokal weiterhin per einfachem HTTP-Server testbar, dann aber ohne DB-Speicherung

## Rechtlicher Hinweis

Dieses Spiel ist ein firmeneigenes Lern- und Berufsorientierungsangebot. Es ist von öffentlich bekannten Awareness-Formaten inspiriert, verwendet aber eigene Inhalte und ist keine offizielle Veröffentlichung des BSI.

Es werden keine BSI-Originaltexte, BSI-Grafiken, BSI-Logos oder BSI-PDF-Inhalte verwendet.

## Aktuelle VPS-Preview

Die Preview läuft hinter Nginx Proxy Manager und Authelia:

```text
https://preview.example.com/
```

Diese Subdomain wird aktuell als geschützte Vorschau für das Escape-Game genutzt.

## Lokaler Start auf dem VPS

### MVP-Deployment

Die voll funktionsfähige Docker-/PostgreSQL-Version läuft auf dem VPS hinter Nginx Proxy Manager/Authelia unter:

```text
https://escape-game.example.com/
```

Betriebsdoku:

```text
docs/mvp_deployment.md
```

### One-Click Self-Hosting mit Docker Compose

```bash
cd /root/projects/it-escape-game
cp .env.example .env
# Wichtig: POSTGRES_PASSWORD und ADMIN_PIN in .env ändern
docker compose up -d --build
```

Dann öffnen:

```text
http://127.0.0.1:8080/
```

Beim ersten Start legt die App das Datenbankschema an und importiert die Inhalte aus `src/data/*.json`. Danach ist PostgreSQL die führende Datenquelle für Admin-Editor-Änderungen.

Healthcheck:

```bash
curl http://127.0.0.1:8080/api/health
```

Logs:

```bash
docker compose logs -f app
```

Stoppen:

```bash
docker compose down
```

Datenbankdaten bleiben im Docker-Volume `it-escape-game_postgres-data` erhalten. Komplett zurücksetzen:

```bash
docker compose down -v
```

### Statischer Fallback ohne DB

```bash
cd /root/projects/it-escape-game
python3 -m http.server 8080
```

Dann öffnen:

```text
http://127.0.0.1:8080/src/
```

Im statischen Fallback funktioniert das Spiel weiter, aber Admin-Editor-Änderungen werden nur lokal im Browser gespeichert.

## Smoke-Test

```bash
cd /root/projects/it-escape-game
node tests/smoke-check.mjs
```

## Audio neu generieren

Die App erwartet MP3-Dateien unter `public/audio/` mit den Dateinamen aus `src/data/audio.json`.
Für hochwertige deutsche Sprecher*innenstimmen kann das ElevenLabs-Skript genutzt werden:

```bash
cd /root/projects/it-escape-game
python3 scripts/generate-elevenlabs-audio.py
```

Voraussetzung ist `ELEVENLABS_API_KEY` in `/root/.hermes/.env`. Das Skript nutzt `eleven_v3` und überschreibt die vorhandenen MP3-Dateien mit denselben Namen.

## Cursor-Übergabe

Für die Weiterarbeit in Cursor siehe:

```text
docs/cursor_handoff.md
docs/cursor_workflow.md
AGENTS.md
```

Empfohlen ist Cursor Remote-SSH auf den VPS mit geöffnetem Projektordner:

```text
/root/projects/it-escape-game
```

## Projektstruktur

```text
it-escape-game/
├── AGENTS.md
├── README.md
├── src/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── data/
│       ├── stations.json
│       ├── hints.json
│       ├── audio.json
│       └── facilitator.json
├── public/
│   ├── audio/
│   ├── img/
│   └── print/
├── docs/
└── tests/
```

## Spielleiter- und Admin-Modus

Der Spielleiter-Modus nutzt im MVP einen einfachen PIN als Sichtschutz:

```text
1984
```

Das ist kein echter Sicherheitsmechanismus, sondern ein einfacher Admin-Schutz. Im Docker-Setup wird der PIN über `ADMIN_PIN` in `.env` gesetzt. Im statischen Fallback kommt der PIN aus `src/data/facilitator.json`.

Nach dem Freischalten kann im Spielleiter-Dialog der Admin-Editor geöffnet werden. Dort lassen sich Fragen, Aufgaben, Codes, Hinweise, Lernpunkte, Berufsbezüge, Materialien und Spielleiter-Lösungen bearbeiten.

Wichtig:

- Im Docker-/PostgreSQL-Betrieb speichert der Admin-Editor serverseitig in der Datenbank.
- Im statischen Fallback speichert der Admin-Editor nur lokal im Browser.
- `src/data/*.json` bleiben als initialer Seed und Fallback erhalten.


## Audio

Audio-Dateien sind optional. Fehlende MP3-Dateien dürfen das Spiel nicht blockieren. Die geplanten Skripte liegen später unter:

`public/print/audio_skripte.md`

MP3-Dateien werden unter `public/audio/` abgelegt.

## Deployment

Siehe:

`docs/deployment_ubuntu_nginx.md`
