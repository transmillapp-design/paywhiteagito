#!/bin/bash

# Script de Sincronização Automática de Versão
# Uso: ./sync_version.sh <versao> "<descrição>"
# Exemplo: ./sync_version.sh v2.4.2 "🐛 FIX: Correção no login"

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          🔄 SINCRONIZAÇÃO AUTOMÁTICA DE VERSÃO            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Validar parâmetros
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}❌ Uso incorreto!${NC}"
    echo ""
    echo "Uso: ./sync_version.sh <versao> \"<descrição>\""
    echo ""
    echo "Exemplos:"
    echo "  ./sync_version.sh v2.4.2 \"🐛 FIX: Correção no login\""
    echo "  ./sync_version.sh v2.5.0 \"✨ NEW: Nova funcionalidade X\""
    echo ""
    exit 1
fi

VERSION=$1
DESCRIPTION=$2

# Validar formato de versão (vX.Y.Z)
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Formato de versão inválido!${NC}"
    echo "Use o formato: vX.Y.Z (exemplo: v2.4.2)"
    exit 1
fi

# Mostrar o que será feito
echo -e "${BLUE}📋 Configuração:${NC}"
echo "   Versão: $VERSION"
echo "   Descrição: $DESCRIPTION"
echo ""

# Confirmar
read -p "Continuar com a sincronização? (s/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada pelo usuário${NC}"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🚀 Iniciando sincronização...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Passo 1: Atualizar VERSION.txt
echo -e "${BLUE}1️⃣  Atualizando VERSION.txt...${NC}"
./update_version.sh "$VERSION" "$DESCRIPTION"
echo -e "${GREEN}   ✅ VERSION.txt atualizado${NC}"
echo ""

# Passo 2: Atualizar Frontend (App.js)
echo -e "${BLUE}2️⃣  Atualizando Frontend (App.js)...${NC}"

FRONTEND_FILE="/app/frontend/src/App.js"

if [ ! -f "$FRONTEND_FILE" ]; then
    echo -e "${RED}   ❌ Arquivo não encontrado: $FRONTEND_FILE${NC}"
    exit 1
fi

# Backup
cp "$FRONTEND_FILE" "${FRONTEND_FILE}.backup"

# Atualizar FRONTEND_VERSION
sed -i "s/const FRONTEND_VERSION = 'v[0-9]*\.[0-9]*\.[0-9]*';/const FRONTEND_VERSION = '$VERSION';/g" "$FRONTEND_FILE"

# Atualizar BUILD log
sed -i "s/BUILD v[0-9]*\.[0-9]*\.[0-9]*/BUILD $VERSION/g" "$FRONTEND_FILE"

# Verificar se foi atualizado
if grep -q "FRONTEND_VERSION = '$VERSION'" "$FRONTEND_FILE"; then
    echo -e "${GREEN}   ✅ Frontend atualizado para $VERSION${NC}"
    rm -f "${FRONTEND_FILE}.backup"
else
    echo -e "${RED}   ❌ Erro ao atualizar frontend${NC}"
    mv "${FRONTEND_FILE}.backup" "$FRONTEND_FILE"
    exit 1
fi
echo ""

# Passo 3: Verificar sincronização
echo -e "${BLUE}3️⃣  Verificando sincronização...${NC}"

VERSION_TXT=$(cat /app/VERSION.txt | head -1)
VERSION_FRONTEND=$(grep "FRONTEND_VERSION = " /app/frontend/src/App.js | cut -d"'" -f2)

echo "   VERSION.txt:       $VERSION_TXT"
echo "   Frontend (App.js): $VERSION_FRONTEND"
echo ""

if [ "$VERSION_TXT" = "$VERSION_FRONTEND" ] && [ "$VERSION_TXT" = "$VERSION" ]; then
    echo -e "${GREEN}   ✅ Todas as versões sincronizadas corretamente!${NC}"
else
    echo -e "${RED}   ❌ ERRO: Versões desincronizadas!${NC}"
    echo "   Esperado: $VERSION"
    exit 1
fi
echo ""

# Passo 4: Perguntar sobre reiniciar serviços
echo -e "${BLUE}4️⃣  Serviços${NC}"
read -p "Deseja reiniciar o backend agora? (s/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}   ⏳ Reiniciando backend...${NC}"
    sudo supervisorctl restart backend
    sleep 3
    echo -e "${GREEN}   ✅ Backend reiniciado${NC}"
else
    echo -e "${YELLOW}   ⚠️  Lembre-se de reiniciar o backend mais tarde!${NC}"
fi
echo ""

# Passo 5: Teste rápido
echo -e "${BLUE}5️⃣  Teste rápido...${NC}"
sleep 2

# Verificar se backend está rodando
BACKEND_STATUS=$(sudo supervisorctl status backend | awk '{print $2}')
if [ "$BACKEND_STATUS" = "RUNNING" ]; then
    echo -e "${GREEN}   ✅ Backend: RUNNING${NC}"
    
    # Testar endpoint de versão
    API_VERSION=$(curl -s http://localhost:8001/api/labelview/version-check | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
    if [ "$API_VERSION" = "$VERSION" ]; then
        echo -e "${GREEN}   ✅ API retorna versão correta: $API_VERSION${NC}"
    else
        echo -e "${YELLOW}   ⚠️  API retorna: $API_VERSION (aguarde alguns segundos e teste novamente)${NC}"
    fi
else
    echo -e "${RED}   ❌ Backend: $BACKEND_STATUS${NC}"
fi
echo ""

# Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Versão: $VERSION"
echo "📝 Descrição: $DESCRIPTION"
echo ""
echo "📋 Próximos passos:"
echo "   1. ✅ Commit suas mudanças"
echo "   2. ✅ Fazer deploy"
echo "   3. ✅ Verificar no painel: Console (F12) deve mostrar $VERSION"
echo "   4. ✅ Testar funcionalidade alterada"
echo ""
echo "📄 Arquivos atualizados:"
echo "   - /app/VERSION.txt"
echo "   - /app/frontend/src/App.js"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
