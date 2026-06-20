#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    echo -e "${RED}❌ Uso: ./update-version.sh <nova_versão>${NC}"
    echo "   Exemplo: ./update-version.sh 2.30.3"
    exit 1
fi

NEW_VERSION=$1
CURRENT_VERSION=$(grep -oP 'version="\K[^"]+' /app/backend/server.py | head -1)

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ATUALIZAÇÃO DE VERSÃO - TRANSMILL   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 Versão atual:${NC} $CURRENT_VERSION"
echo -e "${GREEN}🎯 Nova versão:${NC}  $NEW_VERSION"
echo ""

# Confirmar
read -p "Confirma atualização? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Cancelado${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Atualizando arquivos...${NC}"

DATE=$(date +"%Y-%m-%d %H:%M:%S")

# 1. Atualizar backend server.py
cd /app/backend
sed -i "s/\"version\": \"v[0-9.]*\"/\"version\": \"$NEW_VERSION\"/g" server.py
echo -e "${GREEN}✅ 1/4 - Backend server.py atualizado${NC}"

# 2. Atualizar frontend App.js
cd /app/frontend/src
sed -i "s/FRONTEND_VERSION = 'v[0-9.]*'/FRONTEND_VERSION = '$NEW_VERSION'/g" App.js
sed -i "s/BUILD v[0-9.]*/BUILD $NEW_VERSION/g" App.js
echo -e "${GREEN}✅ 2/4 - Frontend App.js atualizado${NC}"

# 3. Atualizar VERSION.txt
echo "$NEW_VERSION" > /app/VERSION.txt
echo "$DATE" >> /app/VERSION.txt
echo "Atualização de versão | Sistema estável" >> /app/VERSION.txt
echo -e "${GREEN}✅ 3/4 - VERSION.txt atualizado${NC}"

# 4. Atualizar VERSION.md
cd /app

# Reiniciar backend
echo ""
echo -e "${BLUE}🔄 Reiniciando backend...${NC}"
sudo supervisorctl restart backend > /dev/null 2>&1
echo -e "${GREEN}✅ Backend reiniciado${NC}"

# Aguardar serviço subir
echo -e "${YELLOW}⏳ Aguardando serviço inicializar...${NC}"
sleep 5

# Verificar versão implantada
DEPLOYED_VERSION=$(curl -s http://localhost:8001/api/health | jq -r '.version' 2>/dev/null)

echo ""
if [ "$DEPLOYED_VERSION" == "$NEW_VERSION" ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ VERSÃO IMPLANTADA COM SUCESSO!   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🎉 Versão $NEW_VERSION ativa!${NC}"
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║      ❌ ERRO NA ATUALIZAÇÃO!          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Versão esperada: $NEW_VERSION${NC}"
    echo -e "${RED}Versão implantada: $DEPLOYED_VERSION${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 PRÓXIMOS PASSOS:${NC}"
echo -e "   ${YELLOW}1.${NC} Atualizar ${BLUE}/app/VERSION.md${NC} com as mudanças"
echo -e "   ${YELLOW}2.${NC} Verificar no console do navegador (F12)"
echo -e "   ${YELLOW}3.${NC} Testar as funcionalidades alteradas"
echo -e "   ${YELLOW}4.${NC} Fazer commit: ${GREEN}git commit -am \"v$NEW_VERSION\"${NC}"
echo ""
echo -e "${GREEN}✨ Verificação rápida:${NC}"
echo -e "   curl http://localhost:8001/api/health | jq '.version'"
echo ""
