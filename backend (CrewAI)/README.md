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

## DigitalOcean Knowledge Base anbinden

1. In DigitalOcean eine Knowledge Base erstellen und OpenSearch-Kosten prüfen.
2. Die vier Quellen gemäss Tabelle hochladen und warten, bis die Indexierung abgeschlossen ist.
3. Die UUID der Knowledge Base als `DO_KNOWLEDGE_BASE_ID` setzen. Einen DigitalOcean API-Token mit `GenAI:read` als `DO_KNOWLEDGE_BASE_TOKEN` setzen. Lokal kommen die Werte in `.env`, im Kubernetes-Deployment wird der Token aus einem Secret als Umgebungsvariable eingebunden.
4. Das Backend mit den neuen Einstellungen starten. Cedrics Testfragen über `POST /api/chat` oder die Web-UI stellen und die Quellenlinks prüfen.

| Upload-Dateiname | Originalquelle |
| --- | --- |
| `abbts-agb.md` | [ABB TS – AGB](https://www.abbts.ch/rechtliches/agb) |
| `abbts-englisch.md` | [ABB TS – Kompetenznachweis Englisch](https://www.abbts.ch/bildungsangebot/kurse/kompetenznachweis-englisch) |
| `Notebook-Anforderungen_2025.pdf` | [ABB TS – Notebook-Anforderungen](https://www.abbts.ch/resources/Notebook-Anforderungen_2025.pdf) |
| `ABB_TS_Studienfuehrer_INFORMATIK_web.pdf` | [ABB TS – Studienführer Informatik](https://www.abbts.ch/resources/ABB_TS_Studienfuehrer_INFORMATIK_web.pdf) |

Für die zwei Markdown-Dateien die relevanten Abschnitte der Webseiten übernehmen. Die PDFs unter ihren Originalnamen hochladen. Diese Dateinamen erlauben dem Backend, Treffer aus der Upload-Suche den öffentlichen Original-Links zuzuordnen.

Die DigitalOcean-Suche hat Vorrang, wenn `DO_KNOWLEDGE_BASE_ID` gesetzt ist. Für andere Suchdienste bleibt `RAG_URL` mit optionalem `RAG_TOKEN` verfügbar. Diese Schnittstelle nimmt `{"query":"...","top_k":5}` entgegen und liefert `{"passages":[{"text":"...","title":"...","url":"https://example.org/"}]}`. Ohne RAG-Konfiguration stehen die Stundenplanabfragen weiterhin zur Verfügung.

### Abnahmetests

- Wie werden mir die Kosten während meines Studiums in Rechnung gestellt? Und was ist, wenn ich ein Studienjahr wiederholen müsste? [ABB TS – AGB](https://www.abbts.ch/rechtliches/agb)
- Wie kann ich meine Englischkenntnisse nachweisen, um mein Diplom zu erhalten, und bis wann muss ich dies tun? [ABB TS – Kompetenznachweis Englisch](https://www.abbts.ch/bildungsangebot/kurse/kompetenznachweis-englisch)
- Ich bin am Ende meines ersten Studienjahres und muss mir einen neuen Computer kaufen. Was muss ich dabei beachten? [ABB TS – Notebook-Anforderungen](https://www.abbts.ch/resources/Notebook-Anforderungen_2025.pdf)
- Ich habe den Arbeitgeber gewechselt. Muss ich die Schule darüber informieren? [ABB TS – Studienführer Informatik](https://www.abbts.ch/resources/ABB_TS_Studienfuehrer_INFORMATIK_web.pdf)

Bei mehrteiligen Fragen prüfen, ob jede Teilantwort belegt ist. Bei fehlender Textgrundlage soll der Agent die Lücke benennen. Im Frontend müssen verfügbare Links zur Originalquelle führen.

[DigitalOcean-Dokumentation zur Retrieval API](https://docs.digitalocean.com/products/inference/how-to/create-manage-agent-knowledge-bases/#retrieve-data-from-a-knowledge-base-using-the-knowledge-base-api)
