# ============================================
# STAGE 1: BUILD (executado UMA VEZ, depois cached)
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependências de sistema
RUN apk add --no-cache python3 py3-pip python3-dev make g++ curl bash

# ===== FRONTEND BUILD =====
# Copiar APENAS package files primeiro (melhor cache)
COPY frontend/package*.json frontend/yarn.lock* ./frontend/
WORKDIR /app/frontend
RUN yarn install --frozen-lockfile --network-timeout 300000

# Copiar código e buildar
COPY frontend/ .
ARG BACKEND_URL=https://app.transmill.com.br
ENV REACT_APP_BACKEND_URL=${BACKEND_URL}/api
ENV GENERATE_SOURCEMAP=false
ENV NODE_ENV=production
RUN yarn build

# ===== BACKEND DEPS =====
WORKDIR /app
COPY backend/requirements.txt ./backend/
RUN pip3 install --no-cache-dir -r backend/requirements.txt

# ============================================
# STAGE 2: RUNTIME (RÁPIDO - só copia arquivos)
# ============================================
FROM node:18-alpine

# Instalar apenas runtime dependencies
RUN apk add --no-cache python3 curl bash && \
    npm install -g serve --silent

WORKDIR /app

# Copiar Python packages do builder
COPY --from=builder /usr/lib/python3.*/site-packages /usr/lib/python3.11/site-packages

# Copiar frontend buildado (já pronto!)
COPY --from=builder /app/frontend/build ./frontend/build

# Copiar backend source
COPY backend/ ./backend/

# Copiar startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

EXPOSE 3000 8001

# Health check (runtime já está pronto rapidamente)
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=10 \
  CMD curl -f http://localhost:8001/health || exit 1

CMD ["/app/start.sh"]
