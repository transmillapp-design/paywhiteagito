"""
Script para limpar todos os planos antigos e começar do zero
com a nova regra de cálculo
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Configuração MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/agitomil_db')

async def limpar_planos():
    """Deletar TODOS os planos antigos"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.get_database()
    
    print("\n🧹 LIMPANDO PLANOS ANTIGOS")
    print("=" * 60)
    
    # Contar planos antes
    total_antes = await db.labelview_planos.count_documents({})
    print(f"📊 Total de planos encontrados: {total_antes}")
    
    if total_antes == 0:
        print("✅ Nenhum plano encontrado. Banco já está limpo!")
        client.close()
        return
    
    # Mostrar alguns exemplos
    exemplos = await db.labelview_planos.find({}).limit(3).to_list(3)
    
    print("\n📋 Exemplos de planos que serão deletados:")
    for plano in exemplos:
        print(f"   - ID: {plano.get('id')}")
        print(f"     Tipo: {plano.get('tipo_veiculo')}")
        print(f"     Faixa FIPE: R$ {plano.get('valor_fipe_min')} - R$ {plano.get('valor_fipe_max')}")
        print(f"     Valor: R$ {plano.get('valor_total_mensal', 0):.2f}")
        print()
    
    # DELETAR TODOS
    resultado = await db.labelview_planos.delete_many({})
    
    print("=" * 60)
    print(f"🗑️  Planos deletados: {resultado.deleted_count}")
    print("=" * 60)
    
    # Verificar se limpou tudo
    total_depois = await db.labelview_planos.count_documents({})
    
    if total_depois == 0:
        print("✅ Banco limpo com sucesso!")
        print("\n📝 Próximos passos:")
        print("   1. Faça login como Unidade")
        print("   2. Vá em 'Planos' → 'Criar Plano Automático'")
        print("   3. Crie novos planos com a regra CORRETA")
        print("   4. Agora o cálculo será: Valor Tabela + Percentual")
    else:
        print(f"⚠️  ATENÇÃO: Ainda existem {total_depois} planos no banco!")
    
    client.close()

if __name__ == "__main__":
    print("\n🚀 LIMPEZA DE PLANOS LABELVIEW")
    asyncio.run(limpar_planos())
    print("\n✅ Processo concluído!\n")
