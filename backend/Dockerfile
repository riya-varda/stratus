# ── Base ──────────────────────────────────────────────────
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

# ── Dependencies ──────────────────────────────────────────
FROM base AS deps

COPY requirements.txt .
RUN pip install -r requirements.txt

# ── Development ───────────────────────────────────────────
FROM deps AS development

COPY requirements.txt .
RUN pip install watchfiles aiosqlite pytest-asyncio httpx

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ── Production ────────────────────────────────────────────
FROM deps AS production

COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 stratus && \
    adduser --system --uid 1001 --gid 1001 stratus

USER stratus

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
