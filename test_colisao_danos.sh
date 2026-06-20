#!/bin/bash

echo "🧪 TESTE - COLISÃO E DANOS MATERIAIS"
echo "===================================="
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

# Importar Colisão
echo "2️⃣ Importando Colisão..."
IMPORT_COLISAO=$(curl -s -X POST http://localhost:8001/api/labelview/tabelas/importar-colisao \
  -H "Authorization: Bearer $TOKEN")

echo "$IMPORT_COLISAO" | python3 -m json.tool
echo ""

# Importar Danos Materiais
echo "3️⃣ Importando Danos Materiais e Terceiros..."
IMPORT_DANOS=$(curl -s -X POST http://localhost:8001/api/labelview/tabelas/importar-danos-materiais-terceiros \
  -H "Authorization: Bearer $TOKEN")

echo "$IMPORT_DANOS" | python3 -m json.tool
echo ""

# Verificar no banco
echo "4️⃣ Verificando no banco de dados..."
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
    
    print("\n" + "=" * 60)
    print("📊 COLISÃO")
    print("=" * 60)
    
    total_colisao = await db.labelview_tabelas_valores.count_documents({
        "tipo_cobertura": "Colisão",
        "ativo": True
    })
    
    print(f"📦 Total: {total_colisao} registros")
    print(f"✅ Esperado: 60 (5 tipos × 12 faixas)")
    print(f"🎯 Status: {'OK!' if total_colisao == 60 else 'ERRO!'}")
    
    if total_colisao > 0:
        print("\n📋 Tipos:")
        for tipo in ["Carros Leves", "Aplicativos", "Moto", "SUV, Pickup, Van", "Caminhão"]:
            count = await db.labelview_tabelas_valores.count_documents({
                "tipo_cobertura": "Colisão",
                "tipo_veiculo_assistencia": tipo,
                "ativo": True
            })
            print(f"   ✅ {tipo}: {count} registros (R$ 3,50)")
    
    print("\n" + "=" * 60)
    print("📊 DANOS MATERIAIS E TERCEIROS")
    print("=" * 60)
    
    total_danos = await db.labelview_tabelas_valores.count_documents({
        "tipo_cobertura": "Danos materiais e Terceiros",
        "ativo": True
    })
    
    print(f"📦 Total: {total_danos} registros")
    print(f"✅ Esperado: 180 (3 limites × 5 tipos × 12 faixas)")
    print(f"🎯 Status: {'OK!' if total_danos == 180 else 'ERRO!'}")
    
    if total_danos > 0:
        print("\n📋 Por Limite de Cobertura:")
        limites = [
            {"limite": 30000, "valor": 17.90},
            {"limite": 60000, "valor": 25.00},
            {"limite": 100000, "valor": 30.00}
        ]
        
        for lim in limites:
            count = await db.labelview_tabelas_valores.count_documents({
                "tipo_cobertura": "Danos materiais e Terceiros",
                "limite_cobertura_dmt": lim["limite"],
                "ativo": True
            })
            print(f"   ✅ Limite R$ {lim['limite']:,.2f}: {count} registros (R$ {lim['valor']:.2f})")
    
    print()
    client.close()

asyncio.run(main())
EOF

echo ""
echo "✅ Teste concluído!"
