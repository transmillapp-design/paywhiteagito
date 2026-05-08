#!/bin/bash

echo "🧪 TESTE - CARRO RESERVA"
echo "========================"
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
echo "2️⃣ Importando Carro Reserva..."
IMPORT=$(curl -s -X POST http://localhost:8001/api/labelview/tabelas/importar-carro-reserva \
  -H "Authorization: Bearer $TOKEN")

echo "$IMPORT" | python3 -m json.tool
echo ""

# Verificar no banco
echo "3️⃣ Verificando no banco de dados..."
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
    
    print("\n📊 CARRO RESERVA - VERIFICAÇÃO COMPLETA")
    print("=" * 60)
    print()
    
    # Tipos que DEVEM existir
    tipos_devem_existir = ["Carros Leves", "Aplicativos", "SUV, Pickup, Van"]
    
    print("✅ TIPOS QUE DEVEM EXISTIR (com R$ 3,50):")
    for tipo in tipos_devem_existir:
        count = await db.labelview_tabelas_valores.count_documents({
            "tipo_cobertura": "Carro Reserva",
            "tipo_veiculo_assistencia": tipo,
            "ativo": True
        })
        status = "✅" if count == 12 else "❌"
        print(f"   {status} {tipo}: {count} registros")
    
    print()
    print("❌ TIPOS QUE NÃO DEVEM EXISTIR:")
    tipos_nao_devem = ["Moto", "Caminhão"]
    for tipo in tipos_nao_devem:
        count = await db.labelview_tabelas_valores.count_documents({
            "tipo_cobertura": "Carro Reserva",
            "tipo_veiculo_assistencia": tipo,
            "ativo": True
        })
        status = "✅" if count == 0 else "⚠️"
        print(f"   {status} {tipo}: {count} registros (esperado: 0)")
    
    # Total
    total = await db.labelview_tabelas_valores.count_documents({
        "tipo_cobertura": "Carro Reserva",
        "ativo": True
    })
    
    print()
    print(f"📦 TOTAL: {total} registros")
    print(f"✅ Esperado: 36 registros (3 tipos × 12 faixas)")
    print(f"🎯 Status: {'OK!' if total == 36 else 'ERRO!'}")
    print()
    
    # Mostrar exemplos
    print("📋 EXEMPLOS:")
    cursor = db.labelview_tabelas_valores.find({
        "tipo_cobertura": "Carro Reserva",
        "ativo": True
    }).limit(3)
    
    async for doc in cursor:
        print(f"   • {doc.get('tipo_veiculo_assistencia')} - R$ {doc.get('valor_servico'):.2f}")
        print(f"     Faixa: R$ {doc.get('valor_fipe_min'):,.2f} - R$ {doc.get('valor_fipe_max'):,.2f}")
    
    client.close()

asyncio.run(main())
EOF

echo ""
echo "✅ Teste concluído!"
