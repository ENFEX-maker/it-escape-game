# Ubuntu/Nginx Deployment

## Lokaler Test

```bash
cd /root/projects/it-escape-game
python3 -m http.server 8080
```

Öffnen:

```text
http://127.0.0.1:8080/src/
```

## Statisches Deployment

Die App ist statisch. Für Nginx müssen `src/` und `public/` so ausgeliefert werden, dass die relativen Pfade funktionieren.

Ein einfacher Zielpfad:

```bash
sudo mkdir -p /var/www/it-escape-game
sudo rsync -a --delete /root/projects/it-escape-game/src/ /var/www/it-escape-game/
sudo mkdir -p /var/www/public
sudo rsync -a --delete /root/projects/it-escape-game/public/ /var/www/public/
sudo chown -R www-data:www-data /var/www/it-escape-game /var/www/public
```

Hinweis: Die App referenziert Audio und Printmaterial aktuell relativ über `../public/...`. Für ein final sauberes Deployment können wir später `public/` in die Webroot integrieren oder die Pfade auf `/audio/` und `/print/` umstellen.

## Beispiel-Nginx

```nginx
server {
    listen 80;
    server_name escape.example.com;

    root /var/www/it-escape-game;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /public/ {
        alias /var/www/public/;
    }
}
```

## Aktivieren

```bash
sudo ln -s /etc/nginx/sites-available/it-escape-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Vor Veranstaltung prüfen

- Browser öffnet Startseite.
- Station 1 lässt sich mit falschem und richtigem Code testen.
- Spielleiter-PIN funktioniert.
- Audio-Buttons zeigen bei fehlenden Dateien eine freundliche Meldung oder spielen MP3 ab.
- Printmaterialien sind erreichbar.
