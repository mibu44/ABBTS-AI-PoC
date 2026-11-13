import json
import os
from datetime import date
from pathlib import Path

from mcp.server.fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import PlainTextResponse


DATA_FILE = Path(os.getenv("TIMETABLE_FILE", "/app/data/stundenplan.json"))
mcp = FastMCP(
    "ABBTS-Stundenplan",
    host="0.0.0.0",
    port=8080,
    stateless_http=True,
    json_response=True,
)


@mcp.tool()
def stundenplan_abfragen(
    klasse: str, von: date, bis: date | None = None
) -> list[dict[str, str]]:
    """Liefert Unterrichtstermine einer Klasse im Zeitraum (beide Tage inklusive).

    Datum im Format JJJJ-MM-TT. Ohne bis wird nur der Tag von abgefragt.
    """
    letzter_tag = bis or von
    if letzter_tag < von:
        raise ValueError("Das Enddatum muss am oder nach dem Startdatum liegen.")

    termine = json.loads(DATA_FILE.read_text(encoding="utf-8-sig"))
    passende_termine = [
        termin
        for termin in termine
        if termin["klasse"].casefold() == klasse.strip().casefold()
        and von <= date.fromisoformat(termin["datum"]) <= letzter_tag
    ]
    return sorted(passende_termine, key=lambda termin: (termin["datum"], termin["start"]))


@mcp.custom_route("/healthz", methods=["GET"])
async def health(_request: Request) -> PlainTextResponse:
    return PlainTextResponse("ok")


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
