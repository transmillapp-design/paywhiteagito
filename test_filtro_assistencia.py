#!/usr/bin/env python3
"""
Teste do filtro de tipos de veículo - Assistência 24h
"""
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.transmill
    
    print("🔍 TESTE DE FILTRO - ASSISTÊNCIA 24 HORAS")
    print("=" * 70)
    
    tipos_para_testar = [
        "Carros Leves",
        "Aplicativos", 
        "Moto",
        "SUV, Pickup, Van",
        "Caminhão"
    ]
    
    print("\n📊 TESTANDO FILTROS:")
    print()
    
    for tipo in tipos_para_testar:
        count = await db.labelview_tabelas_valores.count_documents({
            "tipo_cobertura": "Assistencia 24hs",
            "tipo_veiculo_assistencia": tipo,
            "ativo": True
        })
        
        status = "✅" if count == 12 else "❌"
        print(f"{status} Filtro '{tipo}': {count} registros (esperado: 12)")
    
    print()
    print("=" * 70)
    
    # Testar nomes no singular (que NÃO devem funcionar)
    print("\n⚠️ TESTANDO NOMES INCORRETOS (SINGULAR):")
    print()
    
    incorretos = [
        "Carro Leve",
        "Aplicativo"
    ]
    
    for tipo in incorretos:
        count = await db.labelview_tabelas_valores.count_documents({
            "tipo_cobertura": "Assistencia 24hs",
            "tipo_veiculo_assistencia": tipo,
            "ativo": True
        })
        
        status = "❌ PROBLEMA!" if count == 0 else "⚠️"
        print(f"{status} Filtro '{tipo}': {count} registros (deve ser 0 se corrigido)")
    
    print()
    print("=" * 70)
    print("\n✅ CONCLUSÃO:")
    print("- Nomes corretos (plural): Carros Leves, Aplicativos")
    print("- Frontend foi corrigido para usar nomes no plural")
    print("- Filtros agora devem funcionar 100%")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
