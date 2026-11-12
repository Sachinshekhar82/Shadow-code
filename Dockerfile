# ==============================================================================
# SHADOW-CODE: Production Multi-Stage Dockerfile
# Combines React Frontend Build & FastAPI + AI + Security Scanner Engine
# ==============================================================================

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Security Scanners
FROM python:3.11-slim AS runtime

# Install system dependencies for git, curl, and native security scanner extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy application code, security rules, and scripts
COPY backend/ ./backend/
COPY scanner/ ./scanner/
COPY scripts/ ./scripts/
COPY sample_vulnerable_service.py ./
COPY vulnerable_api_service.py ./
COPY README.md ./

# Copy built frontend from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Environment settings
ENV PYTHONPATH="/app"
ENV PORT=8000
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
