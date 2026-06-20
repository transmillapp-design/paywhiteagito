#!/bin/bash

# Script de Verificação de Sincronização de Versão
# Uso: ./check_version_sync.sh

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          🔍 VERIFICAÇÃO DE SINCRONIZAÇÃO                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Buscar versões
VERSION_TXT=$(cat /app/VERSION.txt 2>/dev/null | head -1 || echo "N/A")
VERSION_FRONTEND=$(grep "FRONTEND_VERSION = " /app/frontend/src/App.js 2>/dev/null | cut -d"'" -f2 || echo "N/A")

# Tentar pegar versão do backend via API
BACKEND_RUNNING=$(sudo supervisorctl status backend 2>/dev/null | grep -c "RUNNING" || echo "0")
if [ "$BACKEND_RUNNING" = "1" ]; then
    sleep 2
    VERSION_BACKEND=$(curl -s http://localhost:8001/api/labelview/version-check 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
else
    VERSION_BACKEND="Backend não está rodando"
fi

# Mostrar versões
echo -e "${BLUE}📋 Versões encontradas:${NC}"
echo ""
echo "   1️⃣  VERSION.txt:       $VERSION_TXT"
echo "   2️⃣  Frontend (App.js): $VERSION_FRONTEND"
echo "   3️⃣  Backend (API):     $VERSION_BACKEND"
echo ""

# Verificar sincronização
ALL_SYNCED=true

if [ "$VERSION_TXT" = "N/A" ] || [ "$VERSION_FRONTEND" = "N/A" ]; then
    echo -e "${RED}❌ ERRO: Arquivos não encontrados!${NC}"
    ALL_SYNCED=false
elif [ "$VERSION_TXT" != "$VERSION_FRONTEND" ]; then
    echo -e "${RED}❌ ERRO: Versões DESINCRONIZADAS!${NC}"
    echo ""
    echo "VERSION.txt e Frontend (App.js) devem ter a mesma versão!"
    echo ""
    ALL_SYNCED=false
else
    echo -e "${GREEN}✅ VERSION.txt e Frontend sincronizados!${NC}"
    echo ""
fi

# Verificar backend
if [ "$BACKEND_RUNNING" = "1" ]; then
    if [ "$VERSION_BACKEND" = "$VERSION_TXT" ]; then
        echo -e "${GREEN}✅ Backend API sincronizado!${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Backend retorna versão diferente: $VERSION_BACKEND${NC}"
        echo "   Versão esperada: $VERSION_TXT"
        echo "   Tente reiniciar: sudo supervisorctl restart backend"
        echo ""
        ALL_SYNCED=false
    fi
else
    echo -e "${YELLOW}⚠️  Backend não está rodando - não foi possível verificar versão da API${NC}"
    echo ""
fi

# Data e descrição da versão
if [ -f "/app/VERSION.txt" ]; then
    echo -e "${BLUE}📝 Informações da versão atual:${NC}"
    echo ""
    VERSION_DATE=$(sed -n '2p' /app/VERSION.txt 2>/dev/null || echo "N/A")
    VERSION_DESC=$(sed -n '3p' /app/VERSION.txt 2>/dev/null || echo "N/A")
    echo "   📅 Data: $VERSION_DATE"
    echo "   📝 Descrição: $VERSION_DESC"
    echo ""
fi

# Resultado final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ALL_SYNCED" = true ]; then
    echo -e "${GREEN}✅ SISTEMA 100% SINCRONIZADO!${NC}"
    echo ""
    echo "Versão atual: $VERSION_TXT"
else
    echo -e "${RED}❌ SISTEMA DESINCRONIZADO!${NC}"
    echo ""
    echo "Execute: ./sync_version.sh <nova_versao> \"<descrição>\""
    echo "Exemplo: ./sync_version.sh v2.4.2 \"🐛 FIX: Descrição\""
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Exit code
if [ "$ALL_SYNCED" = true ]; then
    exit 0
else
    exit 1
fi
