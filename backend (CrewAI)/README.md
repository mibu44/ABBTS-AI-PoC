# Campus Chat mit CrewAI

Dieses Backend nimmt Chatnachrichten unter `POST /api/chat` entgegen.

- **Campus-Dispatcher (CrewAI):** Ordnet die Anfrage dem Stundenplan,
  Schulwissen oder beiden zu. Er berücksichtigt den Gesprächsverlauf und
  liefert strukturierte Datumsangaben und eine Suchanfrage.
- **Stundenplan:** Das Backend ruft das MCP-Tool `stundenplan_abfragen`
  mit der konfigurierten Klasse auf und formatiert die Einträge direkt.
- **Schulinfo-Agent (CrewAI):** Beantwortet Fragen anhand der von Cedrics
  RAG gelieferten Textstellen. Das Backend übernimmt Quellenlinks aus
  den verwendeten Stellen.

## Lokal starten

Voraussetzungen sind Python 3.12, ein laufender Stundenplan-MCP und Zugang
zum konfigurierten Sprachmodell. Im Ordner `backend (CrewAI)`:

```powershell
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --env-file .env --host 127.0.0.1 --port 8000
```

Vor dem Start den Modellzugang in `.env` eintragen. Die mitgelieferte
Konfiguration ist für OpenAI vorbereitet. Lokaler MCP-Standard ist
`http://127.0.0.1:8080/mcp`. Im selben Kubernetes-Namespace lautet die
URL `http://stundenplan-mcp:8080/mcp`.

```powershell
$body = @{
    conversation_id = 'test'
    messages = @(@{ role = 'user'; content = 'Wie sieht der Stundenplan am 16.11.2026 aus?' })
} | ConvertTo-Json -Depth 4
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/chat -ContentType application/json -Body $body
```

Mit dem aktuellen Stundenplan sind sechs Lektionen in Raum 2D06 zu erwarten.
Für die Browser-Anbindung die Campus-Chat-Route `/api/chat` zum Backend
weiterleiten und im Frontend `demo: false` setzen.

## Cedrics RAG anbinden

Die tatsächliche Schnittstelle steht noch aus. Der Adapter in
`answer_knowledge` erwartet die vollständige Such-URL in `RAG_URL`
und unterstützt optional einen Bearer-Token über `RAG_TOKEN`.
Die Anfrage ist ein HTTP POST mit `{"query":"...","top_k":5}`.
Die erwartete Antwort sieht so aus:

```json
{
  "passages": [
    {"text": "Relevanter Auszug", "title": "Quellentitel", "url": "https://example.org/quelle"}
  ]
}
```

Nur `text` ist pro Stelle Pflicht. Wenn Cedrics API ein anderes Format
verwendet, wird der Adapter an die tatsächliche Anfrage und Antwort
angepasst. Ohne `RAG_URL` bleiben Stundenplanabfragen verfügbar.
