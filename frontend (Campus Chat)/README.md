# ABB TS Campus Chat

Responsive, buildfreie Chatoberfläche mit lokalem Gesprächsverlauf. Das Logo ist als Wortmarke anhand der Vorlage nachgebildet. Ein offizielles Logo kann später eingesetzt werden.

## Lokal starten

Im Ordner `frontend (Campus Chat)` ausführen.

`docker build -t abbts-chat:1.0 .`

`docker run --rm -p 8081:80 abbts-chat:1.0`

Danach http://localhost:8081 öffnen. Alternativ `dist (Web UI)` über einen statischen Webserver bereitstellen.

## Coordinator anbinden

In `dist (Web UI)/config.js` oder der Kubernetes ConfigMap demo auf false setzen und endpoint konfigurieren. Der vorgeschlagene Vertrag verwendet POST /api/chat mit JSON.

```json
{"conversation_id":"uuid","messages":[{"role":"user","content":"Wann ist Unterricht?"}]}
```

Erwartete Antwort

```json
{"answer":"Antwort des Coordinators","sources":[{"title":"Quellentitel","url":"https://www.abbts.ch/"}]}
```

Das [CrewAI-Backend](../backend%20%28CrewAI%29/README.md) ordnet Anfragen dem Stundenplan-MCP, der RAG-Wissensbasis oder beiden zu. API-Schlüssel gehören ausschliesslich ins Backend. Die Oberfläche zeigt Antworttext und Quellen. Authentifizierung, persönlicher Klassenzugriff und Streaming sind noch nicht implementiert. Demoantworten enthalten keine echten Stundenplandaten. Gespräche bleiben lokal im Browser gespeichert und können gelöscht werden.

## Kubernetes

Image in eure Registry pushen und image im Deployment entsprechend ersetzen. kubectl apply -f kubernetes.yaml erstellt Deployment, ConfigMap und Service. Für einen lokalen Test kubectl port-forward service/abbts-chat 8081:80 verwenden.

Euer Ingress muss / zum Frontend und /api/chat zum Coordinator routen. Alternativ eine vollständige API-URL konfigurieren und CORS am Backend passend setzen. Nach ConfigMap-Änderungen kubectl rollout restart deployment/abbts-chat ausführen, da subPath-Mounts einen Neustart benötigen. Das Manifest ist eine Ausgangskonfiguration für euren Cluster. Der Clusterbetrieb und die Backendanbindung müssen mit eurer Infrastruktur geprüft werden.## Minikube

Die Web-UI leitet `/api/chat` über Nginx an das CrewAI-Backend weiter. Der Backend-Service muss im selben Namespace existieren, bevor Nginx startet. Die ConfigMap aktiviert den Live-Modus.

Führe die Befehle im Repository-Root aus. Wenn der Stundenplan-MCP in diesem Minikube-Cluster bereits läuft, kannst du die ersten vier Befehle überspringen.

```powershell
docker build -t stundenplan-mcp:1.0.0 '.\mcp-stundenplan (Stundenplan-MCP)'
minikube image load stundenplan-mcp:1.0.0
kubectl --context minikube create configmap stundenplan-mcp-data --from-file='stundenplan.json=.\mcp-stundenplan (Stundenplan-MCP)\stundenplan.json' --dry-run=client -o yaml | kubectl --context minikube apply -f -
kubectl --context minikube apply -f '.\mcp-stundenplan (Stundenplan-MCP)\kubernetes.yaml'

docker build -t abbts-chat-backend:1.0 '.\backend (CrewAI)'
minikube image load abbts-chat-backend:1.0
```

Erstelle ausserhalb des Repositorys eine lokale Datei `campus-backend.env` mit einer Zeile `OPENAI_API_KEY=...`. Verwende ihren Pfad im Secret-Befehl. Optional können in derselben Datei auch die DigitalOcean-RAG-Variablen gesetzt werden.

```powershell
kubectl --context minikube create secret generic abbts-chat-backend --from-env-file='C:\Pfad\campus-backend.env' --dry-run=client -o yaml | kubectl --context minikube apply -f -
kubectl --context minikube apply -f '.\backend (CrewAI)\kubernetes.yaml'
kubectl --context minikube rollout status deployment/abbts-chat-backend --timeout=180s

docker build -t abbts-chat:1.1 '.\frontend (Campus Chat)'
minikube image load abbts-chat:1.1
kubectl --context minikube apply -f '.\frontend (Campus Chat)\kubernetes.yaml'
kubectl --context minikube rollout status deployment/abbts-chat --timeout=180s
kubectl --context minikube port-forward service/abbts-chat 8081:80
```

Öffne [Campus Chat](http://localhost:8081) und frage «Wie sieht mein Stundenplan am 16.11.2026 aus?». Erwartet sind sechs Lektionen in Raum 2D06. Beende einen älteren Port-Forward auf 8081 zuerst.

Für DigitalOcean die Images in eine erreichbare Registry pushen und die Image-Referenzen in den Manifesten anpassen. Die öffentliche Route kann zum Frontend-Service zeigen, da Nginx `/api/chat` intern weiterleitet.
