#!/bin/bash

# Script para forçar rebuild do frontend
# Resolve problema de cache que impede imagens de aparecer

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║              🔄 FORCE FRONTEND REBUILD                               ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}⚠️  Este script irá:${NC}"
echo "   1. Parar o frontend"
echo "   2. Limpar todos os caches"
echo "   3. Fazer rebuild completo"
echo "   4. Reiniciar o serviço"
echo ""

read -p "Continuar? (s/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada${NC}"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}1️⃣  Parando frontend...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sudo supervisorctl stop frontend
echo -e "${GREEN}✅ Frontend parado${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}2️⃣  Limpando caches e build antigo...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd /app/frontend

# Limpar build
if [ -d "build" ]; then
    rm -rf build/
    echo -e "${GREEN}✅ Build removido${NC}"
fi

# Limpar caches
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache/
    echo -e "${GREEN}✅ node_modules/.cache removido${NC}"
fi

if [ -d ".cache" ]; then
    rm -rf .cache/
    echo -e "${GREEN}✅ .cache removido${NC}"
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}3️⃣  Fazendo rebuild...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}⏳ Isso pode levar alguns minutos...${NC}"
echo ""

yarn build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
else
    echo ""
    echo -e "${RED}❌ Erro no build!${NC}"
    echo ""
    echo "Verifique os logs acima e corrija os erros."
    exit 1
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}4️⃣  Reiniciando frontend...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sudo supervisorctl start frontend
echo -e "${GREEN}✅ Frontend iniciado${NC}"
echo ""

echo -e "${YELLOW}⏳ Aguardando serviço inicializar (10 segundos)...${NC}"
sleep 10

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}5️⃣  Verificando status...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATUS=$(sudo supervisorctl status frontend)
echo "$STATUS"
echo ""

if echo "$STATUS" | grep -q "RUNNING"; then
    echo -e "${GREEN}✅ Frontend está RUNNING!${NC}"
    
    # Verificar se build contém a correção
    echo ""
    echo -e "${BLUE}6️⃣  Verificando se a correção está no build...${NC}"
    
    if grep -q "imagensConvertidas" /app/frontend/build/static/js/*.js 2>/dev/null; then
        echo -e "${GREEN}✅ Correção encontrada no build!${NC}"
    else
        echo -e "${YELLOW}⚠️  Correção não encontrada no build (ou build minificado)${NC}"
    fi
else
    echo -e "${RED}❌ Frontend NÃO está rodando!${NC}"
    echo ""
    echo "Últimos logs:"
    sudo supervisorctl tail -30 frontend
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ REBUILD CONCLUÍDO COM SUCESSO!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "   1. Pedir ao usuário para limpar cache do navegador:"
echo "      • Windows/Linux: Ctrl + Shift + R"
echo "      • Mac: Cmd + Shift + R"
echo ""
echo "   2. Verificar no console (F12) se aparece:"
echo "      ✅ VERSÃO FRONTEND: v2.4.0"
echo "      Com timestamp RECENTE"
echo ""
echo "   3. Testar edição de tipo de veículo:"
echo "      • Login: labelview@transmill.com / demo123"
echo "      • Dashboard → Tipos de Veículos → Editar"
echo "      • As imagens DEVEM aparecer!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
