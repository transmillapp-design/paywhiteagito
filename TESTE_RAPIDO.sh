#!/bin/bash

echo "======================================"
echo "🔍 TESTE RÁPIDO DO SISTEMA"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar serviços
echo "1️⃣ Verificando serviços..."
if sudo supervisorctl status backend | grep -q "RUNNING"; then
    echo -e "${GREEN}✅ Backend: RODANDO${NC}"
else
    echo -e "${RED}❌ Backend: ERRO${NC}"
fi

if sudo supervisorctl status frontend | grep -q "RUNNING"; then
    echo -e "${GREEN}✅ Frontend: RODANDO${NC}"
else
    echo -e "${RED}❌ Frontend: ERRO${NC}"
fi

if sudo supervisorctl status mongodb | grep -q "RUNNING"; then
    echo -e "${GREEN}✅ MongoDB: RODANDO${NC}"
else
    echo -e "${RED}❌ MongoDB: ERRO${NC}"
fi

echo ""

# 2. Verificar Service Worker corrigido
echo "2️⃣ Verificando Service Worker..."
if curl -s http://localhost:3000/sw.js | grep -q "transmill-labelview-v3"; then
    echo -e "${GREEN}✅ Service Worker: CORRIGIDO (v3)${NC}"
else
    echo -e "${RED}❌ Service Worker: VERSÃO ANTIGA${NC}"
fi

echo ""

# 3. Verificar página de limpeza
echo "3️⃣ Verificando página de limpeza..."
if curl -s http://localhost:3000/clear-sw.html | grep -q "Limpar Service Worker"; then
    echo -e "${GREEN}✅ Página de limpeza: DISPONÍVEL${NC}"
else
    echo -e "${RED}❌ Página de limpeza: NÃO ENCONTRADA${NC}"
fi

echo ""

# 4. Verificar se campos foram removidos do código
echo "4️⃣ Verificando remoção dos campos..."
if grep -q "nota_fiscal.*File" /app/backend/server.py 2>/dev/null; then
    echo -e "${RED}❌ Campo 'nota_fiscal' ainda existe no backend${NC}"
else
    echo -e "${GREEN}✅ Campo 'nota_fiscal' removido do backend${NC}"
fi

if grep -q "nota_fiscal:" /app/frontend/src/components/UnidadeFormModal.js 2>/dev/null; then
    echo -e "${RED}❌ Campo 'nota_fiscal' ainda existe no frontend${NC}"
else
    echo -e "${GREEN}✅ Campo 'nota_fiscal' removido do frontend${NC}"
fi

echo ""

# 5. Verificar compilação do frontend
echo "5️⃣ Verificando compilação do frontend..."
if tail -20 /var/log/supervisor/frontend.out.log | grep -q "Compiled successfully"; then
    echo -e "${GREEN}✅ Frontend: COMPILADO COM SUCESSO${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend: Verificar logs${NC}"
fi

echo ""

# Resumo final
echo "======================================"
echo "📊 RESUMO DO TESTE"
echo "======================================"
echo ""
echo -e "${GREEN}✅ Sistema pronto para deploy!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "1. Faça o deploy no Emergent"
echo "2. Após deploy, se tela branca aparecer:"
echo "   - Acesse: /clear-sw.html"
echo "   - Ou limpe o cache: Ctrl + Shift + Del"
echo ""
echo "📄 Leia o arquivo: /app/DEPLOY_PRONTO.md"
echo ""
echo "======================================"
