# AGENTS.md – IT Escape Game

## Projektziel

Baue ein eigenständiges, firmeneigenes IT-Escape-Game für Schüler*innen zur Berufsorientierung und IT-Security-Awareness.

Quelle/Spezifikation:

`/home/user/it_escape_game_azubi_toolpaket.md`

Arbeitstitel:

`Azubi-Einsatz: Der Ransomware-Alarm`

## Harte Regeln

1. Keine BSI-Originaltexte, BSI-Grafiken, BSI-Logos oder BSI-PDF-Inhalte übernehmen.
2. Keine echten Unternehmensdaten, echten Credentials, echten Phishing-Domains oder produktiven Infrastrukturdetails einbauen.
3. Keine echten Malware-, Exploit- oder Command-and-Control-Anleitungen erstellen.
4. Fokus bleibt defensive Awareness: Erkennen, Melden, Eindämmen, Wiederherstellen.
5. MVP bleibt Plain HTML/CSS/Vanilla JS, solange kein starker Grund für ein Framework besteht.
6. Content, Lösungen und UI-Logik getrennt halten:
   - Stationen: `src/data/stations.json`
   - Hinweise: `src/data/hints.json`
   - Audio: `src/data/audio.json`
   - Spielleitung: `src/data/facilitator.json`
7. Codes dürfen im Teilnehmermodus nicht sichtbar sein.
8. Der Spielleiter-PIN ist nur Sichtschutz, kein Security-Feature.
9. Änderungen immer mit Smoke-Test prüfen: `node tests/smoke-check.mjs`.
10. Bei UI-Änderungen zusätzlich im Browser prüfen.

## Cursor-Rolle

Cursor soll gezielt genutzt werden für:

- UI-/CSS-Polishing,
- Accessibility,
- Text-/Tonalitätsreview,
- Konsistenzprüfung der JSON-Dateien,
- Refactoring von `src/app.js`, falls nötig.

Cursor soll nicht ohne Auftrag auf React/Vite/Backend umbauen.

## Hermes-Rolle

Hermes übernimmt:

- initiale Struktur,
- Content-Extraktion,
- Datenmodell,
- Smoke-Tests,
- Browser-Prüfung,
- README/Deployment-Doku,
- technische und didaktische Guardrails.

## Definition of Done für MVP

- Startseite vorhanden.
- Stationen 1–6 spielbar.
- Bonusstationen 7–8 vorbereitet oder spielbar.
- Codes werden korrekt geprüft.
- Falsche Codes blockieren Fortschritt.
- Hinweise funktionieren gestaffelt.
- Audio-Buttons sind vorhanden und fehlertolerant.
- Spielleiter-Modus zeigt Lösungen nach PIN.
- Abschlussseite mit Lernpunkten/Berufsbezug vorhanden.
- Printmaterialien als Markdown vorhanden.
- README erklärt lokalen Start und Deployment.
- Smoke-Test besteht.
