#!/usr/bin/env python3
"""
Verificar se as imagens do tipo APLICATIVO foram salvas
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

async def verificar():
    print("=" * 80)
    print("🔍 VERIFICANDO IMAGENS DO TIPO APLICATIVO")
    print("=" * 80)
    print()
    
    # Buscar tipo Aplicativo
    tipo_aplicativo = await db.labelview_tipos_veiculo.find_one({"nome": {"$regex": "aplicativo", "$options": "i"}})
    
    if not tipo_aplicativo:
        print("❌ Tipo 'Aplicativo' não encontrado no banco!")
        print()
        print("Tipos disponíveis:")
        tipos = await db.labelview_tipos_veiculo.find({}).to_list(length=10)
        for tipo in tipos:
            print(f"   - {tipo.get('nome')}")
        return
    
    print(f"✅ Tipo encontrado: {tipo_aplicativo.get('nome')}")
    print(f"   ID: {tipo_aplicativo.get('id')}")
    print(f"   Categoria: {tipo_aplicativo.get('categoria')}")
    print()
    
    # Verificar imagens
    imagens = tipo_aplicativo.get('imagens_vistoria', [])
    
    print(f"📸 IMAGENS DE VISTORIA: {len(imagens)} imagens salvas")
    print()
    
    if not imagens:
        print("❌ NENHUMA IMAGEM SALVA!")
        print()
        print("As imagens NÃO foram salvas no banco de dados.")
        print("Você precisa:")
        print("   1. Editar o tipo 'Aplicativo'")
        print("   2. Adicionar as imagens")
        print("   3. Clicar em 'Atualizar' no final do formulário")
        return
    
    print("✅ IMAGENS FORAM SALVAS!")
    print()
    print("📋 Lista de imagens:")
    print()
    
    for i, img in enumerate(imagens, 1):
        nome = img.get('nome', img.get('nome_campo', 'Sem nome'))
        url = img.get('url', img.get('imagem', 'Sem URL'))
        
        print(f"{i}. {nome}")
        print(f"   URL: {url[:60]}...")
        print()
    
    print("=" * 80)
    print("✅ IMAGENS SALVAS COM SUCESSO!")
    print("=" * 80)
    print()
    print("📝 ONDE ESSAS IMAGENS APARECEM:")
    print()
    print("1. 🎯 Na VISTORIA de veículos tipo 'Aplicativo'")
    print("   - Quando o vistoriador faz uma vistoria")
    print("   - As imagens aparecem como MODELO/REFERÊNCIA")
    print("   - Ele compara com o veículo real")
    print()
    print("2. 📋 No formulário de EDIÇÃO do tipo")
    print("   - Dashboard → Tipos de Veículo → Editar")
    print("   - Seção 'Banco de Imagens para Vistoria'")
    print()
    print("3. 🔍 Na VISUALIZAÇÃO de contratos/proteções")
    print("   - Se o contrato usa tipo 'Aplicativo'")
    print("   - As imagens aparecem como referência")
    print()

if __name__ == "__main__":
    asyncio.run(verificar())
