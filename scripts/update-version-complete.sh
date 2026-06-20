#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}❌ Uso: ./update-version-complete.sh <nova_versão> [descrição]${NC}"
    echo "   Exemplo: ./update-version-complete.sh v2.30.3 \"Correção de bug X\""
    exit 1
fi

NEW_VERSION=$1
DESCRIPTION=${2:-"Atualização de versão"}
CURRENT_VERSION=$(grep -oP "FRONTEND_VERSION = '\K[^']+" /app/frontend/src/App.js | head -1)
DATE=$(date +"%Y-%m-%d %H:%M:%S")

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ATUALIZAÇÃO COMPLETA DE VERSÃO - TRANSMILL  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 Versão atual:${NC}    $CURRENT_VERSION"
echo -e "${GREEN}🎯 Nova versão:${NC}     $NEW_VERSION"
echo -e "${BLUE}📝 Descrição:${NC}       $DESCRIPTION"
echo ""

# Confirmar
read -p "Confirma atualização dos 4 arquivos? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Cancelado${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Atualizando arquivos...${NC}"

# 1. Backend server.py
echo -e "${YELLOW}1/4${NC} Backend server.py..."
sed -i "s/\"version\": \"v[0-9.]*\"/\"version\": \"$NEW_VERSION\"/g" /app/backend/server.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}    ✅ Backend atualizado${NC}"
else
    echo -e "${RED}    ❌ Erro ao atualizar backend${NC}"
    exit 1
fi

# 2. Frontend App.js
echo -e "${YELLOW}2/4${NC} Frontend App.js..."
sed -i "s/FRONTEND_VERSION = 'v[0-9.]*'/FRONTEND_VERSION = '$NEW_VERSION'/g" /app/frontend/src/App.js
sed -i "s/BUILD v[0-9.]* -/BUILD $NEW_VERSION -/g" /app/frontend/src/App.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}    ✅ Frontend atualizado${NC}"
else
    echo -e "${RED}    ❌ Erro ao atualizar frontend${NC}"
    exit 1
fi

# 3. VERSION.txt
echo -e "${YELLOW}3/4${NC} VERSION.txt..."
echo "$NEW_VERSION" > /app/VERSION.txt
echo "$DATE" >> /app/VERSION.txt
echo "$DESCRIPTION" >> /app/VERSION.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}    ✅ VERSION.txt atualizado${NC}"
else
    echo -e "${RED}    ❌ Erro ao atualizar VERSION.txt${NC}"
    exit 1
fi

# 4. VERSION.md
echo -e "${YELLOW}4/4${NC} VERSION.md..."
TEMP_FILE=$(mktemp)
cat > $TEMP_FILE << EOF
## $NEW_VERSION ($DATE)
**$DESCRIPTION**
- Atualização aplicada automaticamente
- Sistema estável

**Arquivos Modificados:**
- Backend e Frontend versionados

---

EOF
cat /app/VERSION.md >> $TEMP_FILE
mv $TEMP_FILE /app/VERSION.md
if [ $? -eq 0 ]; then
    echo -e "${GREEN}    ✅ VERSION.md atualizado${NC}"
else
    echo -e "${RED}    ❌ Erro ao atualizar VERSION.md${NC}"
fi

# Reiniciar serviços
echo ""
echo -e "${BLUE}🔄 Reiniciando serviços...${NC}"
sudo supervisorctl restart backend frontend > /dev/null 2>&1
echo -e "${GREEN}✅ Serviços reiniciados${NC}"

# Aguardar
echo -e "${YELLOW}⏳ Aguardando inicialização...${NC}"
sleep 8

# Verificar
echo ""
echo -e "${BLUE}🔍 Verificando versões implantadas...${NC}"
echo ""

BACKEND_HEALTH=$(curl -s http://localhost:8001/api/health | jq -r '.version' 2>/dev/null)
BACKEND_LABELVIEW=$(curl -s http://localhost:8001/api/labelview/version-check | jq -r '.version' 2>/dev/null)

echo -e "${BLUE}📊 Backend Health:${NC}          $BACKEND_HEALTH"
echo -e "${BLUE}📊 Backend Labelview:${NC}       $BACKEND_LABELVIEW"
echo ""

if [ "$BACKEND_HEALTH" == "$NEW_VERSION" ] && [ "$BACKEND_LABELVIEW" == "$NEW_VERSION" ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      ✅ VERSÃO IMPLANTADA COM SUCESSO!        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🎉 Versão $NEW_VERSION ativa em todos os lugares!${NC}"
else
    echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          ⚠️  ATENÇÃO - VERIFICAR!             ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Versão esperada:${NC} $NEW_VERSION"
    echo -e "${YELLOW}Health retornou:${NC} $BACKEND_HEALTH"
    echo -e "${YELLOW}Labelview retornou:${NC} $BACKEND_LABELVIEW"
fi

echo ""
echo -e "${BLUE}📝 VERIFICAÇÃO NO NAVEGADOR:${NC}"
echo -e "   1. Abra o navegador (limpe cache com ${YELLOW}Ctrl+Shift+R${NC})"
echo -e "   2. Pressione ${YELLOW}F12${NC} para abrir o console"
echo -e "   3. Deve aparecer: ${GREEN}✅ Backend Version: $NEW_VERSION${NC}"
echo -e "   4. E também: ${GREEN}📊 Versão Frontend: $NEW_VERSION${NC}"
echo ""
echo -e "${GREEN}✨ Comandos úteis:${NC}"
echo -e "   ${BLUE}curl http://localhost:8001/api/health | jq '.version'${NC}"
echo -e "   ${BLUE}curl http://localhost:8001/api/labelview/version-check | jq${NC}"
echo ""
