# Cursor-Übergabe – IT Escape Game

Stand: 2026-06-05

## Kurzstatus

Das Projekt liegt auf dem VPS unter:

```text
/root/projects/it-escape-game
```

Aktuelle geschützte Preview:

```text
https://preview.example.com/
```

Die Preview liegt hinter Nginx Proxy Manager und Authelia. Ohne Login ist ein Redirect zu `auth.example.com` korrekt.

Aktueller Git-Stand vor dieser Übergabe:

```text
7044f8b chore: deploy preview behind Authelia
abc17d6 feat: scaffold IT escape game MVP
```

## Projektziel

Statische Web-App für ein firmeneigenes IT-Escape-Game für Schüler*innen zur Berufsorientierung und IT-Security-Awareness.

Arbeitstitel:

```text
Azubi-Einsatz: Der Ransomware-Alarm
```

Die Teilnehmenden spielen ein Junior-IT-Team und lösen fiktive, defensive Aufgaben rund um Phishing, Linkprüfung, Logs, Sofortmaßnahmen, Backups, Netzwerkisolation, Accounts und Codierung.

## Technische Leitplanken

- MVP bleibt Plain HTML/CSS/Vanilla JS.
- Kein React/Vite/Backend einführen, außer Projektleitung beauftragt das explizit.
- Keine echten Unternehmensdaten, echten Credentials, echten Domains für Phishing oder echte Exploit-/Malware-Anleitungen.
- Keine BSI-Originaltexte, BSI-Grafiken, BSI-Logos oder PDF-Inhalte übernehmen.
- Defensive Awareness steht im Fokus: erkennen, melden, eindämmen, wiederherstellen.
- Teilnehmermodus darf Codes/Lösungen nicht direkt anzeigen.
- Spielleiter-PIN ist nur Sichtschutz, kein echtes Sicherheitsfeature.

## Relevante Dateien

```text
src/index.html                 Grundstruktur der App
src/styles.css                 UI/Design
src/app.js                     Vanilla-JS-Logik
src/data/stations.json         Stationen, Aufgaben, Codes, Lernpunkte
src/data/hints.json            Gestaffelte Hinweise
src/data/audio.json            Audio-Metadaten/Skriptreferenzen
src/data/facilitator.json      PIN, Lösungen, Spielleiterinfos
public/print/                  Druck-/Markdownmaterialien
tests/smoke-check.mjs          Konsistenztest
deploy/nginx.conf              Nginx-Config für Static-Container
docker-compose.yml             Static-Preview-Container
docs/vps_preview_authelia.md   VPS/NPM/Authelia-Doku
docs/cursor_workflow.md        Cursor-Rollen und Beispielprompts
AGENTS.md                      Regeln für Coding Agents
```

## Verifizierter Zustand

Smoke-Test zuletzt erfolgreich:

```text
Smoke check passed: 8 Stationen, 6 Hauptstationen, 11 Audio-Skripte.
```

Preview-Container zuletzt aktiv:

```text
it-escape-game-web   Up   my-proxy-network
```

Öffentliche Preview ohne Session zeigt erwarteten Authelia-Redirect:

```text
HTTP/2 302
location: https://auth.example.com/?rd=https://preview.example.com/
```

## Wie Cursor das Projekt öffnen soll

Empfohlen: Cursor Remote-SSH auf den VPS und diesen Ordner öffnen:

```text
/root/projects/it-escape-game
```

Danach zuerst lesen:

```text
AGENTS.md
README.md
docs/cursor_workflow.md
docs/cursor_handoff.md
```

## Lokale/Remote Vorschau

Die dauerhafte Preview läuft bereits über:

```text
https://preview.example.com/
```

Falls Cursor zusätzlich einen lokalen Server braucht:

```bash
cd /root/projects/it-escape-game
python3 -m http.server 8095 --bind 127.0.0.1
```

Dann per Cursor-Portforwarding oder SSH-Tunnel öffnen:

```text
http://127.0.0.1:8095/src/
```

## Pflichtprüfung nach jeder Änderung

Immer ausführen:

```bash
cd /root/projects/it-escape-game
node tests/smoke-check.mjs
```

Bei UI-Änderungen zusätzlich im Browser/Preview prüfen.

## Sinnvolle nächste Cursor-Aufgaben

### 1. UI-/CSS-Polishing

Ziel: Beamer- und Tablet-taugliches dunkles IT-Dashboard, seriös und modern, aber keine übertriebene Hackeroptik.

Prompt:

```text
Verbessere das UI für eine Schüler*innen-Veranstaltung: gut lesbar auf Beamer und Tablet, dunkles IT-Dashboard, seriös-modern, keine übertriebene Hackeroptik. Behalte Plain HTML/CSS/Vanilla JS bei. Ändere primär src/styles.css und nur wenn nötig minimale HTML/JS-Struktur. Nach Änderungen node tests/smoke-check.mjs ausführen.
```

### 2. Accessibility-Pass

Ziel: Tastaturbedienbarkeit, Kontraste, Fokuszustände, Labels und Fehlermeldungen verbessern.

Prompt:

```text
Prüfe die App auf Accessibility: Tastaturbedienbarkeit, Fokuszustände, Kontraste, klare Buttontexte, verständliche Fehlermeldungen und Screenreader-Basics. Behalte Vanilla JS. Keine Frameworks. Nach Änderungen node tests/smoke-check.mjs ausführen.
```

### 3. Content-Konsistenzreview

Ziel: JSON-Dateien und Spielmaterialien prüfen, ohne Sicherheits-/Legal-Leitplanken zu verletzen.

Prompt:

```text
Vergleiche src/data/stations.json, src/data/hints.json, src/data/facilitator.json und public/print/*.md. Prüfe, ob Codes, Hinweise, Kurzlösungen, Lernpunkte und Berufsbezüge konsistent sind. Keine BSI-Originalinhalte ergänzen, keine echten Malware-/Exploitdetails. Melde konkrete Inkonsistenzen und behebe kleine klare Fehler direkt. Danach node tests/smoke-check.mjs ausführen.
```

### 4. Refactoring von src/app.js nur vorsichtig

Ziel: Lesbarkeit verbessern, aber kein Framework und kein Komplettumbau.

Prompt:

```text
Refactore src/app.js vorsichtig für bessere Lesbarkeit und Wartbarkeit. Keine Frameworks, kein Build-Step, keine Änderung am Datenmodell ohne Not. Funktionalität muss gleich bleiben. Danach node tests/smoke-check.mjs ausführen und kurz erklären, was geändert wurde.
```

## Bekannte offene Punkte

- Audio-MP3-Dateien sind noch Platzhalter/nicht zwingend vorhanden. Das ist aktuell gewollt; fehlende Audio-Dateien dürfen das Spiel nicht blockieren.
- `preview.example.com` ist eine vorhandene Preview-Subdomain. Für final wäre `escape-game.example.com` sauberer, sobald DNS/Proxy final eingerichtet werden soll.
- Der Spielleiter-PIN `1984` ist absichtlich nur Sichtschutz, nicht echte Sicherheit.
- Bonusstationen 7–8 sind im Datenmodell enthalten; prüfen, ob sie didaktisch und spielerisch final gewünscht sind.

## Nicht tun

- Nicht ungefragt auf React, Vite, Next.js oder Backend migrieren.
- Nicht die JSON-Struktur groß umbauen.
- Nicht echte Unternehmensdaten, echte Domains, echte Credentials oder reale Exploit-/Malware-Anleitungen ergänzen.
- Nicht BSI-Originalmaterial übernehmen.
- Nicht Codes im Teilnehmermodus sichtbar machen.
