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

Euer Ingress muss / zum Frontend und /api/chat zum Coordinator routen. Alternativ eine vollständige API-URL konfigurieren und CORS am Backend passend setzen. Nach ConfigMap-Änderungen kubectl rollout restart deployment/abbts-chat ausführen, da subPath-Mounts einen Neustart benötigen. Das Manifest ist eine Ausgangskonfiguration für euren Cluster. Der Clusterbetrieb und die Backendanbindung müssen mit eurer Infrastruktur geprüft werden.
