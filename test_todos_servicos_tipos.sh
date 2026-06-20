#!/bin/bash

echo "🧪 TESTE COMPLETO - TODOS OS SERVIÇOS COM TIPOS DE VEÍCULOS"
echo "=============================================================="
echo ""

# Login Master
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"protecao@agitomil.com","password":"demo123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Erro no login!"
    exit 1
fi

echo "✅ Login bem-sucedido!"
echo ""

# Função para testar importação
test_import() {
    local servico=$1
    local endpoint=$2
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 TESTANDO: $servico"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    echo "   🔄 Importando dados..."
    IMPORT=$(curl -s -X POST "http://localhost:8001/api/labelview/tabelas/$endpoint" \
      -H "Authorization: Bearer $TOKEN")
    
    SUCCESS=$(echo $IMPORT | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
    TOTAL=$(echo $IMPORT | python3 -c "import sys, json; print(json.load(sys.stdin).get('total_inseridos', 0))" 2>/dev/null)
    
    if [ "$SUCCESS" == "True" ]; then
        echo "   ✅ Importação bem-sucedida: $TOTAL registros criados"
    else
        MESSAGE=$(echo $IMPORT | python3 -c "import sys, json; print(json.load(sys.stdin).get('detail', 'Erro desconhecido'))" 2>/dev/null)
        echo "   ⚠️  $MESSAGE"
    fi
    echo ""
}

# Testar importações
test_import "Roubo/Furto" "importar-roubo-furto"
test_import "Perda Total" "importar-perda-total"
test_import "Assistência 24h" "importar-assistencia-24h"

# Verificar no banco
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICAÇÃO NO BANCO DE DADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python3 << 'PYEOF'
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.transmill
    
    servicos = ["Roubo/Furto", "Perda Total", "Assistencia 24hs"]
    
    for servico in servicos:
        print(f"📊 {servico}")
        
        cursor = db.labelview_tabelas_valores.find({
            "tipo_cobertura": servico,
            "ativo": True
        }, {"tipo_veiculo_assistencia": 1})
        
        tipos = {}
        async for doc in cursor:
            tipo = doc.get('tipo_veiculo_assistencia')
            if tipo:
                tipos[tipo] = tipos.get(tipo, 0) + 1
        
        if tipos:
            for tipo, count in sorted(tipos.items()):
                status = "✅" if tipo in ["Carros Leves", "Aplicativos"] else "  "
                print(f"   {status} '{tipo}': {count} registros")
        else:
            print(f"   ⚠️  Nenhum registro encontrado")
        print()
    
    client.close()

asyncio.run(main())
PYEOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE COMPLETO FINALIZADO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
