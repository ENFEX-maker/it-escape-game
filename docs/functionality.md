# Funktionsbeschreibung

## Zweck

`Azubi-Einsatz: Der Ransomware-Alarm` ist ein browserbasiertes IT-Escape-Game für Berufsorientierung, Schulbesuche, Ausbildungsmessen und Security-Awareness-Workshops.

Die Teilnehmenden übernehmen die Rolle eines Junior-IT-Teams. Sie untersuchen einen fiktiven Ransomware-Vorfall, sammeln Hinweise und lösen Stationsaufgaben. Jede Station liefert einen dreistelligen Code.

## Zielgruppe

- Schüler*innen ab ca. 14 Jahren
- Praktikumsgruppen
- Azubi- und Recruiting-Veranstaltungen
- interne Awareness-Sessions
- Tag der offenen Tür / Messebetrieb

## Spielumfang

Die aktuelle Version enthält:

- 8 Stationen insgesamt
- 6 Hauptstationen
- 2 optionale Bonus-/Vertiefungsstationen
- 11 Audio-Skripte bzw. Audio-Dateien
- Spielleiter-Modus mit Lösungshilfen
- Admin-Editor für Inhaltsänderungen

## Themen der Stationen

- Phishing und verdächtige E-Mails
- Linkprüfung und URL-Bewertung
- Logbuch-/Vorfallanalyse
- Sofortmaßnahmen bei Sicherheitsvorfällen
- Backup-Entscheidungen
- Netzwerk-Isolierung
- Account-Sicherheit
- einfache Codierungs-/Entschlüsselungsaufgaben

## Rollen im Spiel

### Spielende / Teams

- starten das Spiel im Browser
- bearbeiten die Stationen
- geben Codes ein
- erhalten Feedback und Fortschritt

### Spielleitung

- öffnet den Spielleiter-Modus per PIN
- sieht Lösungen und Erklärungen
- kann Stationen moderieren
- kann bei Bedarf Hinweise geben

### Admin/Editor

- öffnet nach PIN-Freigabe den Admin-Editor
- kann Inhalte bearbeiten:
  - Titel
  - Thema
  - Code
  - Story
  - Aufgabe
  - Materialien
  - Hinweise
  - Lernpunkt
  - Berufsbezug
  - Spielleiter-Lösung
- speichert im Docker-Betrieb serverseitig in PostgreSQL

## Technische Funktion

Die Anwendung besteht aus:

- Node.js/Express Backend
- statischem HTML/CSS/JavaScript Frontend
- PostgreSQL-Datenbank
- Docker Compose Self-Hosting Paket
- JSON-Dateien als Seed und statischer Fallback

Beim ersten Start:

1. Backend verbindet sich mit PostgreSQL.
2. Schema wird angelegt.
3. Inhalte werden aus `src/data/*.json` importiert.
4. Frontend lädt Inhalte über `/api/content`.

Nach dem ersten Start:

- PostgreSQL ist die führende Datenquelle.
- Änderungen aus dem Admin-Editor bleiben persistent.
- Alle Geräte sehen dieselben gespeicherten Inhalte.

## API-Endpunkte

```text
GET /api/health
GET /api/content
PUT /api/admin/stations/:id
```

Der Admin-Speicherendpunkt erwartet den Header:

```text
x-admin-pin: <ADMIN_PIN>
```

## Fallback-Modus

Ohne Backend kann das Frontend weiterhin statisch geöffnet werden.

Dann lädt es die Inhalte aus `src/data/*.json`.

Einschränkung:

- Admin-Editor-Änderungen werden dann nur im Browser gespeichert.
- Es gibt keine serverseitige Persistenz.

## Audio

Audio-Dateien liegen unter:

```text
public/audio/
```

Fehlende Audio-Dateien sollen das Spiel nicht blockieren. Die App zeigt stattdessen eine freundliche Meldung bzw. überspringt die Wiedergabe.

## Betriebsempfehlung

Für Veranstaltungen wird der Docker-/PostgreSQL-Betrieb empfohlen:

```bash
docker compose up -d --build
```

Damit sind Editor-Änderungen persistent und geräteübergreifend verfügbar.
