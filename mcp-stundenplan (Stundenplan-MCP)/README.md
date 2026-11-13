# ABBTS Stundenplan-MCP

Der MCP-Server stellt den Stundenplan der Klasse `IF-24-27-BA-K1-S5` für das
Wintersemester 2026/2027 bereit. Die Daten stammen aus
`SP_IF-24-27-BA-K1-S5_V02.00.pdf` und umfassen 240 Lektionen an 40
Unterrichtstagen vom 5. Oktober 2026 bis zum 11. März 2027. Die Uhrzeiten
entsprechen der lokalen Schulzeit (Europe/Zurich). Rot markierte Lektionen
tragen einen Prüfungshinweis. Die Prüfungsart geht aus der Markierung allein
nicht hervor.

## Dateien

| Datei | Aufgabe |
| --- | --- |
| [server.py](server.py) | Startet FastMCP und liest den Stundenplan bei jeder Abfrage. Mit `TIMETABLE_FILE` lässt sich der Standardpfad `/app/data/stundenplan.json` überschreiben. |
| [stundenplan.json](stundenplan.json) | Enthält Klasse, Datum, Uhrzeiten, Fach, Modulkürzel, Raum, Dozierende gemäss Modullegende und gegebenenfalls einen Hinweis. |
| [requirements.txt](requirements.txt) | Fixiert das Python-MCP-SDK auf Version 1.26.0. |
| [Dockerfile](Dockerfile) | Baut das Image mit Python 3.12, kopiert die JSON-Datei hinein und startet den Server auf Port 8080 als unprivilegierter Benutzer. |
| [kubernetes.yaml](kubernetes.yaml) | Definiert ein Deployment mit einer Replik und einen internen ClusterIP-Service. Das Deployment erwartet die separat erstellte ConfigMap `stundenplan-mcp-data`. |

## Endpunkte und Tool

- `GET /healthz` liefert `ok` und dient in Kubernetes als Readiness-Probe.
- `/mcp` verwendet Streamable HTTP im zustandslosen Modus. Ein MCP-Client
  kann darüber das Tool `stundenplan_abfragen` aufrufen.

Das Tool erwartet `klasse` und `von` sowie optional `bis`. Datumswerte
haben das Format `JJJJ-MM-TT`. Beide Grenzen zählen mit. Ohne `bis` gilt
nur der angegebene Tag. Die Ausgabe ist nach Datum und Startzeit sortiert.
Bei keinem Treffer kommt eine leere Liste zurück. Liegt `bis` vor `von`,
meldet das Tool einen Fehler.

## Lokal mit Docker starten

Im Ordner `mcp-stundenplan (Stundenplan-MCP)` mit laufendem Docker ausführen:

```powershell
docker build -t stundenplan-mcp:1.0.0 .
docker run --rm -p 127.0.0.1:8080:8080 stundenplan-mcp:1.0.0
```

Lass den Container laufen und führe den Healthcheck und den Tool-Aufruf in
einem zweiten PowerShell-Fenster aus:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/healthz
npx --yes @modelcontextprotocol/inspector --cli http://127.0.0.1:8080/mcp --transport http --method tools/call --tool-name stundenplan_abfragen --tool-arg klasse=IF-24-27-BA-K1-S5 --tool-arg von=2026-11-16
```

Der Inspector benötigt Node.js und npm. Der Healthcheck liefert `ok`. Die
Abfrage für den 16. November 2026 liefert sechs Lektionen in Raum `2D06`,
davon drei Cloud Architektur und drei Praxistransfer Semesterarbeit 3.

Falls der lokale Port 8080 belegt ist, starte den Container mit
`-p 127.0.0.1:8081:8080` und verwende in den Test-URLs Port 8081. Mit
`Ctrl+C` beendest du den Container im ersten Terminal.

## Im Kubernetes-Cluster starten

1. Eine Registry verwenden, aus der der Cluster Images laden kann. Bei einer
   privaten Registry gegebenenfalls ein `imagePullSecret` im Deployment
   referenzieren. Den Beispiel-Registry-Pfad durch euren eigenen ersetzen.
2. Das Image pushen und denselben vollständigen Image-Namen in
   `kubernetes.yaml` unter `image:` eintragen.
3. Die Befehle im gewünschten Kubernetes-Kontext und Namespace ausführen.
   Die ConfigMap muss vor dem Deployment angelegt werden.

```powershell
$image = 'registry.example.org/abbts/stundenplan-mcp:1.0.0'
docker tag stundenplan-mcp:1.0.0 $image
docker push $image

kubectl config current-context
kubectl create configmap stundenplan-mcp-data --from-file=stundenplan.json --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f kubernetes.yaml
kubectl rollout status deployment/stundenplan-mcp
kubectl port-forward service/stundenplan-mcp 8080:8080
```

Mit laufendem Port-Forward funktionieren die lokalen Testbefehle erneut.
Bei belegtem Port 8080 kannst du `kubectl port-forward service/stundenplan-mcp 8081:8080`
verwenden und die Test-URLs entsprechend anpassen.

## Stundenplandaten aktualisieren

- **Lokaler Docker-Start:** Nach einer Änderung an `stundenplan.json` das
  Image neu bauen und den Container neu starten. Der lokale Container
  verwendet die beim Build kopierte Datei.
- **Kubernetes:** Nach der Änderung den ConfigMap-Befehl im selben Namespace
  wiederholen. Das Deployment mountet die ConfigMap unter `/app/data`.
  Sobald Kubernetes die Datei im Volume aktualisiert hat, liest die nächste
  Abfrage die neuen Daten. Dafür ist kein Image-Neubau erforderlich.

## Campus Chat anbinden

Im selben Namespace lautet die Adresse für den MCP-Client im Chat-Backend
`http://stundenplan-mcp:8080/mcp`. In einem anderen Namespace lautet der
Service-Host `stundenplan-mcp.<namespace>.svc`.

Für die Anbindung benötigt `/api/chat` ein Chat-Backend mit einem
MCP-Client für Streamable HTTP. Der Client lädt die Tools und ruft
`stundenplan_abfragen` bei Bedarf auf. Sobald das Backend erreichbar ist,
in der Frontend-Konfiguration `endpoint: '/api/chat'` und `demo: false`
setzen.

Das Deployment verwendet einen internen Service ohne eigene
Authentifizierung. Für geschützte Stundenpläne den Zugriff auf den Service
auf das Chat-Backend begrenzen und die Klassenberechtigung der angemeldeten
Person vor dem Tool-Aufruf prüfen.
