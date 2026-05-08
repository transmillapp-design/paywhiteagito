#!/usr/bin/env python3
"""
Script para popular dados iniciais no banco de PRODUÇÃO
Execute este script após fazer deploy para criar:
- Conta master
- Tipos de prestadores iniciais
- Segmentos de negócio iniciais
- Conta demo de prestador
"""
import asyncio
import sys
import os

# Adicionar o diretório backend ao path
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
from passlib.hash import bcrypt

async def seed_production_data():
    """Popular dados iniciais no banco de produção"""
    
    # Usar MONGO_URL do ambiente (produção)
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    print(f"Conectando ao MongoDB: {mongo_url}")
    
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitomil')
    db = client[db_name]
    
    print(f"Usando database: {db_name}\n")
    
    try:
        # ===== 1. CRIAR CONTA MASTER =====
        print("1. Verificando conta master...")
        master = await db.users.find_one({"email": "master@agitocoin.com"})
        
        if not master:
            master_id = "master-demo-001"
            password_hash = bcrypt.hash("master123")
            
            master_data = {
                "id": master_id,
                "full_name": "Master Admin",
                "email": "master@agitocoin.com",
                "password_hash": password_hash,
                "phone": "11999999999",
                "user_type": "master",
                "is_master_account": True,
                "balance": 0.0,
                "cashback_balance": 0.0,
                "usdt_balance": 0.0,
                "is_active": True,
                "is_verified": True,
                "is_blocked": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(master_data)
            print(f"   ✅ Conta master criada: master@agitocoin.com / master123")
        else:
            print(f"   ✅ Conta master já existe")
        
        # ===== 2. CRIAR TIPOS DE PRESTADORES =====
        print("\n2. Criando tipos de prestadores...")
        
        provider_types = [
            {
                "name": "Eletricista",
                "description": "Serviços elétricos residenciais e comerciais",
                "category": "domestico",
                "icon": "⚡"
            },
            {
                "name": "Encanador",
                "description": "Serviços de encanamento e hidráulica",
                "category": "domestico",
                "icon": "🔧"
            },
            {
                "name": "Diarista",
                "description": "Limpeza e organização de ambientes",
                "category": "domestico",
                "icon": "🧹"
            },
            {
                "name": "Jardineiro",
                "description": "Cuidados com jardim e plantas",
                "category": "domestico",
                "icon": "🌿"
            },
            {
                "name": "Pintor",
                "description": "Pintura residencial e comercial",
                "category": "construcao",
                "icon": "🎨"
            },
            {
                "name": "Pedreiro",
                "description": "Serviços de construção e reforma",
                "category": "construcao",
                "icon": "🧱"
            },
            {
                "name": "Marceneiro",
                "description": "Móveis planejados e marcenaria",
                "category": "construcao",
                "icon": "🪚"
            },
            {
                "name": "Mecânico",
                "description": "Manutenção e reparos automotivos",
                "category": "automotivo",
                "icon": "🔩"
            },
            {
                "name": "Eletricista de Autos",
                "description": "Elétrica automotiva",
                "category": "automotivo",
                "icon": "🚗"
            },
            {
                "name": "Cabeleireiro",
                "description": "Cortes e tratamentos capilares",
                "category": "beleza",
                "icon": "💇"
            },
            {
                "name": "Manicure",
                "description": "Cuidados com unhas e estética das mãos",
                "category": "beleza",
                "icon": "💅"
            },
            {
                "name": "Personal Trainer",
                "description": "Treinamento físico personalizado",
                "category": "saude",
                "icon": "💪"
            },
            {
                "name": "Nutricionista",
                "description": "Orientação nutricional e dietas",
                "category": "saude",
                "icon": "🥗"
            },
            {
                "name": "Professor Particular",
                "description": "Aulas particulares e reforço escolar",
                "category": "educacao",
                "icon": "📚"
            },
            {
                "name": "Desenvolvedor",
                "description": "Desenvolvimento de software e sistemas",
                "category": "tecnologia",
                "icon": "💻"
            }
        ]
        
        types_created = 0
        for type_data in provider_types:
            existing = await db.service_provider_types.find_one({"name": type_data["name"]})
            
            if not existing:
                type_id = str(uuid.uuid4())
                provider_type = {
                    "id": type_id,
                    "name": type_data["name"],
                    "description": type_data["description"],
                    "category": type_data["category"],
                    "icon": type_data["icon"],
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc)
                }
                
                await db.service_provider_types.insert_one(provider_type)
                types_created += 1
        
        print(f"   ✅ {types_created} tipos de prestadores criados")
        
        total_types = await db.service_provider_types.count_documents({})
        print(f"   📊 Total no banco: {total_types} tipos")
        
        # ===== 3. CRIAR SEGMENTOS DE NEGÓCIO =====
        print("\n3. Criando segmentos de negócio...")
        
        segments = [
            {
                "name": "Alimentação",
                "description": "Restaurantes, lanchonetes, cafeterias e delivery",
                "cashback_percentage": 5.0
            },
            {
                "name": "Supermercados",
                "description": "Supermercados, mercados e atacados",
                "cashback_percentage": 3.0
            },
            {
                "name": "Farmácias",
                "description": "Farmácias e drogarias",
                "cashback_percentage": 4.0
            },
            {
                "name": "Postos de Combustível",
                "description": "Postos de gasolina e etanol",
                "cashback_percentage": 2.0
            },
            {
                "name": "Vestuário",
                "description": "Lojas de roupas, calçados e acessórios",
                "cashback_percentage": 6.0
            },
            {
                "name": "Eletrônicos",
                "description": "Lojas de eletrônicos e informática",
                "cashback_percentage": 4.0
            },
            {
                "name": "Saúde e Beleza",
                "description": "Clínicas, salões e spas",
                "cashback_percentage": 5.0
            },
            {
                "name": "Educação",
                "description": "Escolas, cursos e livrarias",
                "cashback_percentage": 7.0
            },
            {
                "name": "Entretenimento",
                "description": "Cinemas, teatros e eventos",
                "cashback_percentage": 8.0
            },
            {
                "name": "Serviços Gerais",
                "description": "Outros serviços diversos",
                "cashback_percentage": 5.0
            }
        ]
        
        segments_created = 0
        for segment_data in segments:
            existing = await db.business_segments.find_one({"name": segment_data["name"]})
            
            if not existing:
                segment_id = str(uuid.uuid4())
                segment = {
                    "id": segment_id,
                    "name": segment_data["name"],
                    "description": segment_data["description"],
                    "cashback_percentage": segment_data["cashback_percentage"],
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                
                await db.business_segments.insert_one(segment)
                segments_created += 1
        
        print(f"   ✅ {segments_created} segmentos criados")
        
        total_segments = await db.business_segments.count_documents({})
        print(f"   📊 Total no banco: {total_segments} segmentos")
        
        # ===== 4. CRIAR PRESTADOR DEMO =====
        print("\n4. Criando prestador demo...")
        
        prestador = await db.users.find_one({"email": "prestador@demo.com"})
        
        if not prestador:
            user_id = str(uuid.uuid4())
            password_hash = bcrypt.hash("demo123")
            
            user_data = {
                "id": user_id,
                "full_name": "José Silva Prestador",
                "email": "prestador@demo.com",
                "password_hash": password_hash,
                "phone": "11988776655",
                "user_type": "service_provider",
                "balance": 0.0,
                "cashback_balance": 0.0,
                "usdt_balance": 0.0,
                "is_active": True,
                "is_verified": True,
                "is_blocked": False,
                "referral_code": str(uuid.uuid4())[:8].upper(),
                "referral_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user_data)
            
            # Buscar tipo Eletricista
            eletricista = await db.service_provider_types.find_one({"name": "Eletricista"})
            
            if eletricista:
                provider_id = str(uuid.uuid4())
                provider_profile = {
                    "id": provider_id,
                    "user_id": user_id,
                    "fantasy_name": "JS Elétrica",
                    "document": "12345678901",
                    "document_type": "cpf",
                    "provider_type_id": eletricista["id"],
                    "provider_type_name": eletricista["name"],
                    "address": {
                        "street": "Rua das Flores",
                        "number": "123",
                        "complement": "Casa",
                        "neighborhood": "Centro",
                        "city": "São Paulo",
                        "state": "SP",
                        "zipcode": "01000-000"
                    },
                    "profile_description": "Eletricista profissional com 10 anos de experiência.",
                    "working_hours": "Segunda a Sexta: 8h - 18h",
                    "accepts_emergency": True,
                    "cashback_rate": 0.05,
                    "rating_average": 4.8,
                    "rating_count": 24,
                    "status": "active",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.service_providers.insert_one(provider_profile)
                print(f"   ✅ Prestador demo criado: prestador@demo.com / demo123")
            else:
                print(f"   ⚠️  Tipo Eletricista não encontrado, perfil não criado")
        else:
            print(f"   ✅ Prestador demo já existe")
        
        # ===== 5. CRIAR CLIENTE E LOJISTA DEMO =====
        print("\n5. Criando usuários demo adicionais...")
        
        # Cliente demo
        cliente = await db.users.find_one({"email": "cliente@demo.com"})
        if not cliente:
            cliente_id = "cliente-demo-001"
            password_hash = bcrypt.hash("demo123")
            
            cliente_data = {
                "id": cliente_id,
                "full_name": "Cliente Demo",
                "email": "cliente@demo.com",
                "password_hash": password_hash,
                "phone": "11987654321",
                "user_type": "cliente",
                "cpf": "12345678900",
                "balance": 100.0,
                "cashback_balance": 0.0,
                "usdt_balance": 0.0,
                "is_active": True,
                "is_verified": False,
                "is_blocked": False,
                "referral_code": str(uuid.uuid4())[:8].upper(),
                "referral_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(cliente_data)
            print(f"   ✅ Cliente demo criado: cliente@demo.com / demo123")
        else:
            print(f"   ✅ Cliente demo já existe")
        
        # Lojista demo
        lojista = await db.users.find_one({"email": "lojista@demo.com"})
        if not lojista:
            lojista_id = "lojista-demo-001"
            password_hash = bcrypt.hash("demo123")
            
            lojista_data = {
                "id": lojista_id,
                "full_name": "João Silva",
                "email": "lojista@demo.com",
                "password_hash": password_hash,
                "phone": "11976543210",
                "user_type": "lojista",
                "company_name": "Loja Demo LTDA",
                "cnpj": "12345678000199",
                "address": "Rua Exemplo, 100 - Centro - São Paulo/SP",
                "whatsapp": "11976543210",
                "balance": 0.0,
                "cashback_balance": 0.0,
                "usdt_balance": 0.0,
                "is_active": True,
                "is_verified": True,
                "is_blocked": False,
                "referral_code": str(uuid.uuid4())[:8].upper(),
                "referral_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(lojista_data)
            print(f"   ✅ Lojista demo criado: lojista@demo.com / demo123")
        else:
            print(f"   ✅ Lojista demo já existe")
        
        # ===== RESUMO FINAL =====
        print("\n" + "="*60)
        print("🎉 SEED COMPLETO!")
        print("="*60)
        
        total_users = await db.users.count_documents({})
        total_clients = await db.users.count_documents({"user_type": "cliente"})
        total_merchants = await db.users.count_documents({"user_type": "lojista"})
        total_providers = await db.users.count_documents({"user_type": "service_provider"})
        
        print(f"\n📊 ESTATÍSTICAS:")
        print(f"   Usuários: {total_users}")
        print(f"   - Clientes: {total_clients}")
        print(f"   - Lojistas: {total_merchants}")
        print(f"   - Prestadores: {total_providers}")
        print(f"   Tipos de Prestador: {total_types}")
        print(f"   Segmentos de Negócio: {total_segments}")
        
        print(f"\n🔑 CREDENCIAIS:")
        print(f"   Master: master@agitocoin.com / master123")
        print(f"   Cliente: cliente@demo.com / demo123")
        print(f"   Lojista: lojista@demo.com / demo123")
        print(f"   Prestador: prestador@demo.com / demo123")
        
        print("\n✅ Todos os dados foram populados com sucesso!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    print("="*60)
    print("POPULANDO BANCO DE PRODUÇÃO COM DADOS INICIAIS")
    print("="*60 + "\n")
    asyncio.run(seed_production_data())
