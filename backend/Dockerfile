FROM docker.io/library/python:3.13-slim-bookworm

# Herramientas de compilación para psycopg2 y otras dependencias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Instala uv en la versión exacta que usas en el host (dentro del contenedor)
RUN pip install --no-cache-dir uv==0.11.14

WORKDIR /app

COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]