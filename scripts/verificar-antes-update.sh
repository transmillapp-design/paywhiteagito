#!/bin/bash

# 🔍 VERIFICAÇÃO ANTES DE UPDATE
# Verifica se tudo está funcionando ANTES de fazer alterações

echo "🔍 VERIFICAÇÃO PRÉ-UPDATE"
echo "========================="
echo ""

ERRORS=0

# 1. Verificar serviços
echo "1️⃣ Verificando serviços..."
if sudo supervisorctl status backend | grep -q "RUNNING"; then
    echo "   ✅ Backend rodando"
else
    echo "   ❌ Backend NÃO está rodando"
    ((ERRORS++))
fi

if sudo supervisorctl status frontend | grep -q "RUNNING"; then
    echo "   ✅ Frontend rodando"
else
    echo "   ❌ Frontend NÃO está rodando"
    ((ERRORS++))
fi

# 2. Verificar banco
echo ""
echo "2️⃣ Verificando banco de dados..."
HEALTH=$(curl -s http://localhost:8001/api/health | jq -r '.database' 2>/dev/null)
if [ "$HEALTH" == "connected" ]; then
    echo "   ✅ Banco conectado"
else
    echo "   ❌ Banco NÃO conectado"
    ((ERRORS++))
fi

# 3. Verificar contas críticas
echo ""
echo "3️⃣ Verificando contas críticas..."
python3 << 'PYEOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

async def check_accounts():
    errors = 0
    try:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/transmill')
        client = AsyncIOMotorClient(mongo_url)
        db = client.transmill
        
        # Master Transmill
        master = await db.users.find_one({'email': 'transmillapp@gmail.com'})
        if master and master.get('is_master'):
            print("   ✅ Master Transmill OK")
        else:
            print("   ❌ Master Transmill FALTANDO ou sem permissão")
            errors += 1
        
        # Master Labelview
        master_lv = await db.users.find_one({'email': 'labelview@transmill.com'})
        if master_lv and master_lv.get('is_labelview_master'):
            print("   ✅ Master Labelview OK")
        else:
            print("   ⚠️  Master Labelview pode estar faltando")
        
        # Unidade AgitoAuto
        unidade = await db.users.find_one({'email': 'agitoautobrasil@gmail.com'})
        if unidade:
            print("   ✅ Unidade AgitoAuto OK")
        else:
            print("   ⚠️  Unidade AgitoAuto pode estar faltando")
        
        client.close()
        sys.exit(errors)
        
    except Exception as e:
        print(f"   ❌ Erro ao verificar contas: {e}")
        sys.exit(1)

asyncio.run(check_accounts())
PYEOF

if [ $? -ne 0 ]; then
    ((ERRORS++))
fi

# 4. Verificar sintaxe Python
echo ""
echo "4️⃣ Verificando sintaxe Python..."
python3 -m py_compile /app/backend/server.py 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Sintaxe Python OK"
else
    echo "   ❌ Erro de sintaxe Python"
    ((ERRORS++))
fi

# 5. Verificar npm/yarn
echo ""
echo "5️⃣ Verificando dependências frontend..."
if [ -f "/app/frontend/package.json" ]; then
    echo "   ✅ package.json existe"
else
    echo "   ❌ package.json faltando"
    ((ERRORS++))
fi

# Resumo
echo ""
echo "======================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ TUDO OK - Seguro para atualizar"
    echo "======================================"
    exit 0
else
    echo "❌ $ERRORS PROBLEMAS ENCONTRADOS"
    echo "======================================"
    echo ""
    echo "⚠️  NÃO É SEGURO ATUALIZAR AGORA!"
    echo "   Corrija os problemas antes de continuar"
    exit 1
fi
