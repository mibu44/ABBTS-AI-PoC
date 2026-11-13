# ABB TS Campus Chat

KI-gestützter Campus Chat der Gruppe 1 Systemtechnik für die Semesterarbeit SA 5.1.

| Komponente | Aufgabe |
| --- | --- |
| [Frontend](frontend/README.md) | Chatoberfläche mit HTML, CSS und JavaScript. |
| [Backend](backend/README.md) | CrewAI verarbeitet Anfragen unter `POST /api/chat` und nutzt je nach Frage den Stundenplan-MCP oder Cedrics RAG-Wissensbasis. |
| [Stundenplan-MCP](mcp-stundenplan/README.md) | Stellt die Unterrichtstermine über das Tool `stundenplan_abfragen` bereit. |

## Lokal starten

1. Den [Stundenplan-MCP](mcp-stundenplan/README.md) mit Docker auf Port 8080 starten.
2. Das [Backend](backend/README.md) mit Modellzugang konfigurieren und auf Port 8000 starten. Cedrics Suchschnittstelle muss für allgemeine Schulfragen eingerichtet sein.
3. Das [Frontend](frontend/README.md) auf Port 8081 starten. Für den integrierten Betrieb `/api/chat` zum Backend weiterleiten und den Demo-Modus deaktivieren.

Dockerfiles und Kubernetes-Manifeste liegen bei den Komponenten, für die sie gelten.
