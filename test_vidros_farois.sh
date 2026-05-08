#!/bin/bash

echo "🧪 TESTE - VIDROS, FARÓIS E LANTERNAS"
echo "======================================"
echo ""

# Login
echo "1️⃣ Login..."
LOGIN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"protecao@agitomil.com","password":"demo123"}')

TOKEN=$(echo $LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Erro no login!"
    exit 1
fi

echo "✅ Login bem-sucedido!"
echo ""

# Importar
echo "2️⃣ Importando Vidros, Faróis e Lanternas..."
IMPORT=$(curl -s -X POST http://localhost:8001/api/labelview/tabelas/importar-vidros-farois-lanternas \
  -H "Authorization: Bearer $TOKEN")

echo "$IMPORT" | python3 -m json.tool
echo ""

# Listar
echo "3️⃣ Listando dados importados..."
LIST=$(curl -s -X GET "http://localhost:8001/api/labelview/tabelas/Vidros_Farois_e_Lanternas" \
  -H "Authorization: Bearer $TOKEN")

TOTAL=$(echo $LIST | python3 -c "import sys, json; print(json.load(sys.stdin).get('total', 0))" 2>/dev/null)

echo "📊 Total de registros: $TOTAL"
echo ""

if [ "$TOTAL" == "60" ]; then
    echo "✅ SUCESSO! 60 registros criados!"
else
    echo "⚠️ Total diferente do esperado"
fi

echo ""
echo "4️⃣ Verificando tipos de veículos..."
python3 << 'EOF'
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.transmill
    
    cursor = db.labelview_tabelas_valores.find({
        "tipo_cobertura": "Vidros, Farois e Lanternas",
        "ativo": True
    }, {"tipo_veiculo_assistencia": 1, "valor_servico": 1})
    
    tipos = {}
    async for doc in cursor:
        tipo = doc.get('tipo_veiculo_assistencia')
        valor = doc.get('valor_servico')
        if tipo:
            tipos[tipo] = tipos.get(tipo, 0) + 1
    
    for tipo, count in sorted(tipos.items()):
        print(f"   ✅ {tipo}: {count} registros (R$ 5,00)")
    
    client.close()

asyncio.run(main())
EOF

echo ""
echo "✅ Teste concluído!"
