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

Statische Web-App ohne Backend:

- Plain HTML
- CSS
- Vanilla JavaScript
- JSON-Datenmodell
- lokal per einfachem HTTP-Server testbar
- später per Nginx auf Ubuntu/VPS hostbar

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

```bash
cd /root/projects/it-escape-game
python3 -m http.server 8080
```

Dann über SSH-Portforwarding oder direkt auf dem VPS öffnen:

```text
http://127.0.0.1:8080/src/
```

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

Das ist kein echter Sicherheitsmechanismus. Die App ist statisch; wer den Quellcode öffnet, kann Daten einsehen. Für Veranstaltungen reicht das als Sichtschutz am Gerät.

Nach dem Freischalten kann im Spielleiter-Dialog der Admin-Editor geöffnet werden. Dort lassen sich Fragen, Aufgaben, Codes, Hinweise, Lernpunkte, Berufsbezüge, Materialien und Spielleiter-Lösungen bearbeiten.

Wichtig:

- Änderungen werden lokal im Browser gespeichert (`localStorage`).
- Sie gelten sofort für diese Browser-Session und bleiben nach Neuladen erhalten.
- Über „Bearbeitete Inhalte exportieren“ kann eine JSON-Datei gesichert werden.
- Für dauerhafte Projektänderungen muss diese JSON-Datei später in die Repository-Dateien übernommen werden.
- „Bearbeitete Inhalte zurücksetzen“ löscht nur die lokalen Admin-Anpassungen, nicht den Quellcode.

## Audio

Audio-Dateien sind optional. Fehlende MP3-Dateien dürfen das Spiel nicht blockieren. Die geplanten Skripte liegen später unter:

`public/print/audio_skripte.md`

MP3-Dateien werden unter `public/audio/` abgelegt.

## Deployment

Siehe:

`docs/deployment_ubuntu_nginx.md`
