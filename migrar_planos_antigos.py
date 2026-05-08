"""
Script de Migração: Converter planos antigos para novo formato
- Separar coberturas em principais e adicionais
- Recalcular valor_total (apenas principais)
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

# Configuração MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/agitomil_db')

# Definir quais são principais e quais são adicionais
COBERTURAS_PRINCIPAIS = [
    'Roubo/Furto',
    'Colisão',
    'Danos materiais e Terceiros'
]

ADICIONAIS = [
    'Assistencia 24hs',
    'Vidros, Farois e Lanternas',
    'Carro Reserva'
]

async def migrar_planos():
    """Migrar planos do formato antigo para novo formato"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.get_database()
    
    print("🔄 INICIANDO MIGRAÇÃO DE PLANOS")
    print("=" * 60)
    
    # Buscar todos os planos que têm o campo antigo "coberturas"
    planos_antigos = await db.labelview_planos.find({
        "coberturas": {"$exists": True}
    }).to_list(None)
    
    print(f"📊 Total de planos no formato antigo: {len(planos_antigos)}")
    
    if len(planos_antigos) == 0:
        print("✅ Nenhum plano antigo encontrado. Migração não necessária.")
        return
    
    contador_migrados = 0
    contador_erros = 0
    
    for plano in planos_antigos:
        try:
            plano_id = plano.get('id')
            coberturas_antigas = plano.get('coberturas', [])
            
            # Separar em principais e adicionais
            coberturas_principais = []
            adicionais_lista = []
            
            for cobertura in coberturas_antigas:
                tipo_cobertura = cobertura.get('tipo_cobertura')
                
                # Criar nova estrutura com campo "tipo"
                nova_cobertura = {
                    "tipo_cobertura": cobertura.get('tipo_cobertura'),
                    "valor_base_master": cobertura.get('valor_base_master'),
                    "percentual_unidade": cobertura.get('percentual_unidade'),
                    "valor_venda": cobertura.get('valor_venda'),
                    "limite_cobertura_dmt": cobertura.get('limite_cobertura_dmt')
                }
                
                if tipo_cobertura in COBERTURAS_PRINCIPAIS:
                    nova_cobertura["tipo"] = "principal"
                    coberturas_principais.append(nova_cobertura)
                elif tipo_cobertura in ADICIONAIS:
                    nova_cobertura["tipo"] = "adicional"
                    adicionais_lista.append(nova_cobertura)
                else:
                    # Cobertura desconhecida - tratar como principal por segurança
                    print(f"⚠️  Cobertura desconhecida '{tipo_cobertura}' no plano {plano_id} - tratando como principal")
                    nova_cobertura["tipo"] = "principal"
                    coberturas_principais.append(nova_cobertura)
            
            # Recalcular valor total (APENAS principais)
            novo_valor_total = sum(c['valor_venda'] for c in coberturas_principais)
            
            # Atualizar documento
            resultado = await db.labelview_planos.update_one(
                {"id": plano_id},
                {
                    "$set": {
                        "coberturas_principais": coberturas_principais,
                        "adicionais": adicionais_lista,
                        "valor_total_mensal": round(novo_valor_total, 2),
                        "valor_total_anual": round(novo_valor_total * 12, 2),
                        "atualizado_em": datetime.utcnow(),
                        "migrado_em": datetime.utcnow()
                    },
                    "$unset": {
                        "coberturas": ""  # Remover campo antigo
                    }
                }
            )
            
            if resultado.modified_count > 0:
                contador_migrados += 1
                print(f"✅ Plano {plano_id} migrado - Principais: {len(coberturas_principais)}, Adicionais: {len(adicionais_lista)}, Valor: R$ {novo_valor_total:.2f}")
            
        except Exception as e:
            contador_erros += 1
            print(f"❌ Erro ao migrar plano {plano.get('id')}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("📊 RESUMO DA MIGRAÇÃO")
    print("=" * 60)
    print(f"✅ Planos migrados com sucesso: {contador_migrados}")
    print(f"❌ Erros: {contador_erros}")
    print(f"📦 Total processado: {len(planos_antigos)}")
    print("=" * 60)
    
    # Verificar se ainda existem planos antigos
    planos_restantes = await db.labelview_planos.count_documents({
        "coberturas": {"$exists": True}
    })
    
    if planos_restantes > 0:
        print(f"⚠️  ATENÇÃO: Ainda existem {planos_restantes} planos no formato antigo!")
    else:
        print("✅ Todos os planos foram migrados com sucesso!")
    
    client.close()

async def verificar_planos():
    """Verificar quantos planos existem em cada formato"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.get_database()
    
    total_planos = await db.labelview_planos.count_documents({})
    planos_antigos = await db.labelview_planos.count_documents({"coberturas": {"$exists": True}})
    planos_novos = await db.labelview_planos.count_documents({"coberturas_principais": {"$exists": True}})
    
    print("\n📊 STATUS DOS PLANOS")
    print("=" * 60)
    print(f"Total de planos: {total_planos}")
    print(f"Formato ANTIGO (coberturas): {planos_antigos}")
    print(f"Formato NOVO (coberturas_principais): {planos_novos}")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    print("\n🚀 SCRIPT DE MIGRAÇÃO DE PLANOS LABELVIEW")
    print("=" * 60)
    
    # Verificar status antes
    asyncio.run(verificar_planos())
    
    # Perguntar confirmação
    print("\n⚠️  Esta migração irá:")
    print("   1. Separar coberturas em 'principais' e 'adicionais'")
    print("   2. Recalcular valores (apenas principais)")
    print("   3. Remover o campo antigo 'coberturas'")
    print("\n")
    
    confirmar = input("Deseja continuar? (sim/não): ").strip().lower()
    
    if confirmar in ['sim', 's', 'yes', 'y']:
        asyncio.run(migrar_planos())
        
        # Verificar status depois
        print("\n")
        asyncio.run(verificar_planos())
    else:
        print("❌ Migração cancelada pelo usuário")
