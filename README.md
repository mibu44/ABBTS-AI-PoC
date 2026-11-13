# ABB TS Campus Chat

KI-gestützter Campus Chat der Gruppe 1 Systemtechnik für die Semesterarbeit SA 5.1.

| Komponente | Aufgabe |
| --- | --- |
| [Frontend](frontend%20%28Campus%20Chat%29/README.md) | Chatoberfläche mit HTML, CSS und JavaScript. |
| [Backend](backend%20%28CrewAI%29/README.md) | CrewAI verarbeitet Anfragen unter `POST /api/chat` und nutzt je nach Frage den Stundenplan-MCP oder Cedrics RAG-Wissensbasis. |
| [Stundenplan-MCP](mcp-stundenplan%20%28Stundenplan-MCP%29/README.md) | Stellt die Unterrichtstermine über das Tool `stundenplan_abfragen` bereit. |

## Ordnerstruktur

```text
ABBTS-AI-PoC/
├── frontend (Campus Chat)/
│   └── dist (Web UI)/
├── backend (CrewAI)/
└── mcp-stundenplan (Stundenplan-MCP)/
```

## Lokal starten

1. Den [Stundenplan-MCP](mcp-stundenplan%20%28Stundenplan-MCP%29/README.md) mit Docker auf Port 8080 starten.
2. Das [Backend](backend%20%28CrewAI%29/README.md) mit Modellzugang konfigurieren und auf Port 8000 starten. Cedrics Suchschnittstelle muss für allgemeine Schulfragen eingerichtet sein.
3. Das [Frontend](frontend%20%28Campus%20Chat%29/README.md) auf Port 8081 starten. Für den integrierten Betrieb `/api/chat` zum Backend weiterleiten und den Demo-Modus deaktivieren.

Dockerfiles und Kubernetes-Manifeste liegen bei den Komponenten, für die sie gelten.
