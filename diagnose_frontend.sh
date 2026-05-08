#!/bin/bash

# Script de diagnóstico do frontend
# Verifica se a correção está presente e se o build está atualizado

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║              🔍 DIAGNÓSTICO DO FRONTEND                              ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Versão no código
echo -e "${BLUE}1️⃣  Versão no código fonte:${NC}"
VERSION_CODE=$(grep "FRONTEND_VERSION = " /app/frontend/src/App.js | cut -d"'" -f2)
echo "   $VERSION_CODE"
echo ""

# 2. Verificar build
echo -e "${BLUE}2️⃣  Status do build:${NC}"
if [ -d "/app/frontend/build" ]; then
    echo -e "   ${GREEN}✅ Build existe${NC}"
    
    if [ -f "/app/frontend/build/index.html" ]; then
        BUILD_DATE=$(stat -c '%y' /app/frontend/build/index.html | cut -d'.' -f1)
        echo "   📅 Data do build: $BUILD_DATE"
        
        # Calcular há quanto tempo
        BUILD_TIMESTAMP=$(stat -c '%Y' /app/frontend/build/index.html)
        NOW_TIMESTAMP=$(date +%s)
        DIFF=$((NOW_TIMESTAMP - BUILD_TIMESTAMP))
        HOURS=$((DIFF / 3600))
        
        if [ $HOURS -lt 1 ]; then
            echo -e "   ${GREEN}✅ Build recente (menos de 1 hora)${NC}"
        elif [ $HOURS -lt 24 ]; then
            echo -e "   ${YELLOW}⚠️  Build de $HOURS horas atrás${NC}"
        else
            DAYS=$((HOURS / 24))
            echo -e "   ${RED}❌ Build antigo ($DAYS dias atrás)${NC}"
        fi
    fi
else
    echo -e "   ${RED}❌ Build NÃO existe!${NC}"
    echo "   Execute: yarn build"
fi
echo ""

# 3. Verificar correção no código
echo -e "${BLUE}3️⃣  Verificar correção de conversão de imagens:${NC}"
if grep -q "imagensConvertidas" /app/frontend/src/components/TipoVeiculoModal.js; then
    echo -e "   ${GREEN}✅ Correção está no código${NC}"
    
    # Mostrar a linha
    LINE=$(grep -n "imagensConvertidas" /app/frontend/src/components/TipoVeiculoModal.js | head -1 | cut -d':' -f1)
    echo "   📍 Linha: $LINE"
else
    echo -e "   ${RED}❌ Correção NÃO está no código!${NC}"
    echo "   A correção pode ter sido perdida!"
fi
echo ""

# 4. Verificar correção no build (se existir)
echo -e "${BLUE}4️⃣  Verificar correção no build compilado:${NC}"
if [ -d "/app/frontend/build" ]; then
    # Código minificado pode não conter o termo exato
    if grep -q "imagensConvertidas\|imagens_vistoria" /app/frontend/build/static/js/*.js 2>/dev/null; then
        echo -e "   ${GREEN}✅ Termos relacionados encontrados no build${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Não encontrado (normal se minificado)${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Build não existe${NC}"
fi
echo ""

# 5. Status do serviço
echo -e "${BLUE}5️⃣  Status do serviço frontend:${NC}"
STATUS=$(sudo supervisorctl status frontend 2>/dev/null)
if echo "$STATUS" | grep -q "RUNNING"; then
    echo -e "   ${GREEN}✅ Frontend está RUNNING${NC}"
    echo "   $STATUS"
else
    echo -e "   ${RED}❌ Frontend NÃO está rodando!${NC}"
    echo "   $STATUS"
fi
echo ""

# 6. Verificar logs recentes
echo -e "${BLUE}6️⃣  Últimos logs do frontend:${NC}"
if [ -f "/var/log/supervisor/frontend.err.log" ]; then
    echo "   Últimas 5 linhas:"
    sudo tail -n 5 /var/log/supervisor/frontend.err.log | sed 's/^/   /'
else
    echo -e "   ${YELLOW}⚠️  Log não encontrado${NC}"
fi
echo ""

# 7. Verificar porta
echo -e "${BLUE}7️⃣  Verificar se porta 3000 está em uso:${NC}"
if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Porta 3000 em uso (frontend rodando)${NC}"
else
    echo -e "   ${RED}❌ Porta 3000 NÃO está em uso${NC}"
fi
echo ""

# Resumo e recomendações
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 RESUMO E RECOMENDAÇÕES:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROBLEMS=0

# Verificar problemas
if [ ! -d "/app/frontend/build" ]; then
    echo -e "${RED}❌ PROBLEMA: Build não existe${NC}"
    echo "   Solução: yarn build"
    PROBLEMS=$((PROBLEMS + 1))
fi

if ! grep -q "imagensConvertidas" /app/frontend/src/components/TipoVeiculoModal.js; then
    echo -e "${RED}❌ PROBLEMA: Correção não está no código${NC}"
    echo "   Solução: Restaurar TipoVeiculoModal.js com a correção"
    PROBLEMS=$((PROBLEMS + 1))
fi

if ! echo "$STATUS" | grep -q "RUNNING"; then
    echo -e "${RED}❌ PROBLEMA: Frontend não está rodando${NC}"
    echo "   Solução: sudo supervisorctl start frontend"
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ -f "/app/frontend/build/index.html" ]; then
    BUILD_TIMESTAMP=$(stat -c '%Y' /app/frontend/build/index.html)
    NOW_TIMESTAMP=$(date +%s)
    DIFF=$((NOW_TIMESTAMP - BUILD_TIMESTAMP))
    HOURS=$((DIFF / 3600))
    
    if [ $HOURS -gt 24 ]; then
        echo -e "${YELLOW}⚠️  AVISO: Build está desatualizado (${HOURS}h)${NC}"
        echo "   Recomendação: ./force_frontend_rebuild.sh"
        PROBLEMS=$((PROBLEMS + 1))
    fi
fi

echo ""

if [ $PROBLEMS -eq 0 ]; then
    echo -e "${GREEN}✅ NENHUM PROBLEMA DETECTADO!${NC}"
    echo ""
    echo "Se as imagens ainda não aparecem:"
    echo "   1. Limpar cache do navegador (Ctrl+Shift+R)"
    echo "   2. Verificar console do navegador (F12)"
    echo "   3. Deve mostrar: VERSÃO FRONTEND: v2.4.0"
else
    echo -e "${RED}⚠️  $PROBLEMS PROBLEMA(S) DETECTADO(S)${NC}"
    echo ""
    echo "Execute as soluções acima ou rode:"
    echo "   ./force_frontend_rebuild.sh"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
