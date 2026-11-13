FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY server.py .
COPY stundenplan.json /app/data/stundenplan.json
USER 10001:10001
EXPOSE 8080
CMD ["python", "server.py"]
