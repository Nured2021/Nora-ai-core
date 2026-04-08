FROM python:3.12-slim

WORKDIR /app

# Phase 3: add git (for repo init) and nodejs/npm (for React builds)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev git nodejs npm && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["celery", "-A", "worker.celery_app", "worker", "--loglevel=info", "--queues=default", "--concurrency=4"]
