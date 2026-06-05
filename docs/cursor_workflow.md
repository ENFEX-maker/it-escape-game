# Cursor-Workflow für das IT-Escape-Game

## Empfehlung

Cursor wird nach dem ersten lauffähigen MVP gezielt für UI, Review und Refactoring genutzt. Die initiale technische Basis entsteht auf dem VPS durch Hermes.

## Projekt öffnen

Empfohlen: Cursor per Remote-SSH auf den VPS verbinden und diesen Ordner öffnen:

`/root/projects/it-escape-game`

Alternative: später GitHub-Repo klonen und lokal in Cursor öffnen.

## Rollenverteilung

Hermes:

- initiale Struktur,
- Datenmodell aus Markdown,
- erste lauffähige App,
- Tests und Browser-Checks,
- Deployment-Dokumentation.

Cursor:

- UI-Polishing,
- CSS/Responsive Design,
- Accessibility,
- Content-Konsistenzreview,
- Refactoring von `src/app.js`, wenn sinnvoll.

## Gute Cursor-Prompts

### Architekturreview

```text
Analysiere dieses Projekt. Prüfe, ob Content, UI-Logik und Spielleiterdaten sauber getrennt sind. Schlage nur konkrete Verbesserungen vor, ohne das Projekt auf ein Framework umzubauen.
```

### UI-Polishing

```text
Verbessere das UI für eine Schüler*innen-Veranstaltung: gut lesbar auf Beamer und Tablet, dunkles IT-Dashboard, keine übertriebene Hackeroptik. Behalte Vanilla JS bei.
```

### Content-Konsistenz

```text
Vergleiche stations.json, hints.json und facilitator.json. Prüfe, ob alle Codes, Hinweise, Lösungen und Lernpunkte konsistent sind. Keine BSI-Originalinhalte ergänzen.
```

### Accessibility

```text
Prüfe die App auf Tastaturbedienbarkeit, Kontraste, klare Buttontexte und verständliche Fehlermeldungen. Verbessere nur HTML/CSS/JS, keine Frameworks.
```

## Grenzen

Cursor soll nicht:

- ohne Auftrag React/Vite/Backend einführen,
- die Datenstruktur komplett umbauen,
- BSI-Materialien ergänzen,
- echte Exploit-/Malware-Anleitungen erzeugen,
- Codes im Teilnehmermodus sichtbar machen.
