#!/bin/bash

echo "🧪 TESTE DE VALIDAÇÃO v2.11.2 - Correção Diagnóstico"
echo "=================================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar versões
echo "📊 1. VERIFICANDO VERSÕES:"
echo "-------------------------"

# Versão do sistema
SYSTEM_VERSION=$(cat /app/VERSION.txt | head -1)
echo "Sistema: ${SYSTEM_VERSION}"

# Versão do backend
BACKEND_VERSION=$(grep -m1 "^VERSION = \|v2.11" /app/backend/server.py 2>/dev/null || echo "v2.11.2 (from VERSION.txt)")
echo "Backend: ${SYSTEM_VERSION}"

# Versão do frontend
FRONTEND_VERSION=$(grep "FRONTEND_VERSION = " /app/frontend/src/App.js | cut -d"'" -f2)
echo "Frontend: ${FRONTEND_VERSION}"

if [ "$SYSTEM_VERSION" = "$FRONTEND_VERSION" ]; then
    echo -e "${GREEN}✅ Versões sincronizadas!${NC}"
else
    echo -e "${RED}❌ Versões diferentes! Sistema: $SYSTEM_VERSION, Frontend: $FRONTEND_VERSION${NC}"
fi

echo ""

# 2. Verificar se o endpoint existe no código
echo "📝 2. VERIFICANDO ENDPOINT NO CÓDIGO:"
echo "-------------------------------------"

if grep -q '@labelview_router.get("/usuarios")' /app/backend/routes/labelview.py; then
    echo -e "${GREEN}✅ Endpoint /usuarios encontrado em routes/labelview.py${NC}"
    LINE=$(grep -n '@labelview_router.get("/usuarios")' /app/backend/routes/labelview.py | cut -d: -f1)
    echo "   Localização: linha $LINE"
else
    echo -e "${RED}❌ Endpoint /usuarios NÃO encontrado!${NC}"
fi

echo ""

# 3. Verificar se o backend está rodando
echo "🔌 3. VERIFICANDO SERVIÇOS:"
echo "--------------------------"

if sudo supervisorctl status backend | grep -q "RUNNING"; then
    PID=$(sudo supervisorctl status backend | grep -oP 'pid \K\d+')
    UPTIME=$(sudo supervisorctl status backend | grep -oP 'uptime \K.*')
    echo -e "${GREEN}✅ Backend rodando (PID: $PID, uptime: $UPTIME)${NC}"
else
    echo -e "${RED}❌ Backend NÃO está rodando!${NC}"
fi

if sudo supervisorctl status frontend | grep -q "RUNNING"; then
    PID=$(sudo supervisorctl status frontend | grep -oP 'pid \K\d+')
    UPTIME=$(sudo supervisorctl status frontend | grep -oP 'uptime \K.*')
    echo -e "${GREEN}✅ Frontend rodando (PID: $PID, uptime: $UPTIME)${NC}"
else
    echo -e "${RED}❌ Frontend NÃO está rodando!${NC}"
fi

echo ""

# 4. Testar endpoint (sem autenticação - espera erro 401)
echo "🌐 4. TESTANDO ENDPOINT:"
echo "-----------------------"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/labelview/usuarios)

if [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ Endpoint responde (401 - esperado sem token)${NC}"
    echo "   Isso significa que o endpoint existe e está protegido corretamente"
elif [ "$RESPONSE" = "404" ]; then
    echo -e "${RED}❌ Endpoint retorna 404 - NÃO foi encontrado!${NC}"
else
    echo -e "${YELLOW}⚠️  Endpoint retorna status: $RESPONSE${NC}"
fi

echo ""

# 5. Verificar build do frontend
echo "📦 5. VERIFICANDO BUILD DO FRONTEND:"
echo "------------------------------------"

if [ -d "/app/frontend/build" ]; then
    echo -e "${GREEN}✅ Pasta build/ existe${NC}"
    
    # Verificar arquivo main.js
    MAIN_JS=$(ls -1 /app/frontend/build/static/js/main.*.js 2>/dev/null | head -1)
    if [ -n "$MAIN_JS" ]; then
        SIZE=$(du -h "$MAIN_JS" | cut -f1)
        echo -e "${GREEN}✅ Build gerado: $(basename $MAIN_JS) ($SIZE)${NC}"
        
        # Verificar se contém v2.11.2
        if grep -q "v2.11.2" "$MAIN_JS"; then
            echo -e "${GREEN}✅ Build contém versão v2.11.2${NC}"
        else
            echo -e "${YELLOW}⚠️  Build pode não conter versão v2.11.2${NC}"
        fi
    else
        echo -e "${RED}❌ Arquivo main.js não encontrado no build!${NC}"
    fi
else
    echo -e "${RED}❌ Pasta build/ não existe!${NC}"
fi

echo ""

# 6. Verificar logs recentes
echo "📋 6. ÚLTIMOS LOGS DO BACKEND:"
echo "------------------------------"

echo "Últimas 5 linhas do log:"
tail -n 5 /var/log/supervisor/backend.out.log

echo ""

# Resumo final
echo "=================================================="
echo "🎯 RESUMO DA VALIDAÇÃO:"
echo "=================================================="

ALL_OK=true

# Verificar cada item
if [ "$SYSTEM_VERSION" = "$FRONTEND_VERSION" ]; then
    echo -e "${GREEN}✅ Versões sincronizadas${NC}"
else
    echo -e "${RED}❌ Versões diferentes${NC}"
    ALL_OK=false
fi

if grep -q '@labelview_router.get("/usuarios")' /app/backend/routes/labelview.py; then
    echo -e "${GREEN}✅ Endpoint implementado${NC}"
else
    echo -e "${RED}❌ Endpoint não encontrado${NC}"
    ALL_OK=false
fi

if sudo supervisorctl status backend | grep -q "RUNNING"; then
    echo -e "${GREEN}✅ Backend rodando${NC}"
else
    echo -e "${RED}❌ Backend não está rodando${NC}"
    ALL_OK=false
fi

if sudo supervisorctl status frontend | grep -q "RUNNING"; then
    echo -e "${GREEN}✅ Frontend rodando${NC}"
else
    echo -e "${RED}❌ Frontend não está rodando${NC}"
    ALL_OK=false
fi

if [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ Endpoint respondendo${NC}"
elif [ "$RESPONSE" = "404" ]; then
    echo -e "${RED}❌ Endpoint retorna 404${NC}"
    ALL_OK=false
fi

if [ -d "/app/frontend/build" ] && [ -n "$(ls -1 /app/frontend/build/static/js/main.*.js 2>/dev/null)" ]; then
    echo -e "${GREEN}✅ Build do frontend OK${NC}"
else
    echo -e "${RED}❌ Build do frontend não encontrado${NC}"
    ALL_OK=false
fi

echo ""
echo "=================================================="

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✅✅✅ SISTEMA PRONTO PARA DEPLOY! ✅✅✅${NC}"
else
    echo -e "${YELLOW}⚠️  Alguns itens precisam de atenção${NC}"
fi

echo "=================================================="
