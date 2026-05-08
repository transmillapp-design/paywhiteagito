import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid

async def seed_crm_data():
    """Popular CRM com dados de teste"""
    
    # Conectar ao MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitomil')
    db = client[db_name]
    
    print(f"🔗 Conectando ao banco: {db_name}")
    
    # Limpar dados antigos
    await db.labelview_crm_leads.delete_many({})
    await db.labelview_crm_protecoes.delete_many({})
    await db.labelview_unidades.delete_many({})
    
    print("🗑️  Dados antigos removidos")
    
    # ===== CRIAR UNIDADES =====
    unidades = [
        {
            'id': str(uuid.uuid4()),
            'name': 'AgitoAuto',
            'cnpj': '12.345.678/0001-90',
            'address': 'Rua Principal, 123',
            'city': 'São Paulo',
            'state': 'SP',
            'phone': '11 3456-7890',
            'is_active': True,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'AgitoAuto Brasil',
            'cnpj': '98.765.432/0001-10',
            'address': 'Av. Paulista, 1000',
            'city': 'São Paulo',
            'state': 'SP',
            'phone': '11 2345-6789',
            'is_active': True,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'AgitoAuto Rio',
            'cnpj': '11.222.333/0001-44',
            'address': 'Av. Atlântica, 500',
            'city': 'Rio de Janeiro',
            'state': 'RJ',
            'phone': '21 3333-4444',
            'is_active': True,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'AgitoAuto Sul',
            'cnpj': '55.666.777/0001-88',
            'address': 'Rua das Flores, 200',
            'city': 'Curitiba',
            'state': 'PR',
            'phone': '41 4444-5555',
            'is_active': True,
            'created_at': datetime.utcnow()
        }
    ]
    
    if unidades:
        await db.labelview_unidades.insert_many(unidades)
        print(f"✅ {len(unidades)} unidades criadas")
    
    # ===== CRIAR LEADS =====
    leads = [
        {
            'id': str(uuid.uuid4()),
            'name': 'João Silva',
            'email': 'joao.silva@email.com',
            'phone': '11987654321',
            'cpf': '123.456.789-00',
            'unit': 'AgitoAuto',
            'responsible': 'Rafael Carlos Silva Bersch',
            'source': 'website',
            'status': 'ativo',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Maria Santos',
            'email': 'maria.santos@email.com',
            'phone': '11976543210',
            'cpf': '987.654.321-00',
            'unit': 'AgitoAuto Brasil',
            'responsible': 'AgitoAuto Brasil',
            'source': 'indicacao',
            'status': 'ativo',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Pedro Oliveira',
            'email': 'pedro.oliveira@email.com',
            'phone': '11965432109',
            'cpf': '456.789.123-00',
            'unit': 'AgitoAuto',
            'responsible': 'Rafael Carlos Silva Bersch',
            'source': 'telefone',
            'status': 'ativo',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Marcos Jose Ferreira Costa',
            'email': 'marcos.costa@email.com',
            'phone': '11954321098',
            'cpf': '321.654.987-00',
            'unit': 'AgitoAuto',
            'responsible': 'Rafael Carlos Silva Bersch',
            'source': 'website',
            'status': 'ativo',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Wilson',
            'email': 'wilson@email.com',
            'phone': '11943210987',
            'cpf': '789.123.456-00',
            'unit': 'AgitoAuto Brasil',
            'responsible': 'AgitoAuto Brasil',
            'source': 'indicacao',
            'status': 'ativo',
            'created_at': datetime.utcnow()
        }
    ]
    
    if leads:
        await db.labelview_crm_leads.insert_many(leads)
        print(f"✅ {len(leads)} leads criados")
    
    # ===== CRIAR PROTEÇÕES (FUNIL DE VENDAS) =====
    
    # Proteções em Interesse (4 cadastros)
    protecoes_interesse = [
        {
            'id': str(uuid.uuid4()),
            'title': 'Proteção de Alcides',
            'client_name': 'Alcides',
            'vehicle': 'LTP2796',
            'status': 'interesse',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Proteção de Wilson',
            'client_name': 'Wilson',
            'vehicle': 'LMA1088',
            'status': 'interesse',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Proteção de Marcelo',
            'client_name': 'Marcelo de Moura Mattos',
            'vehicle': 'PVA5996',
            'status': 'interesse',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Proteção de Ana Paula',
            'client_name': 'Ana Paula Costa',
            'vehicle': 'ABC1234',
            'status': 'interesse',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    ]
    
    # Proteções em Negociação (17 cadastros)
    protecoes_negociacao = []
    nomes_negociacao = [
        'Fabio Rodrigues Menezes Mendes',
        'Jorge',
        'Christian Santiago Barragan Pozo',
        'Marcos',
        'Elcio Rezende da Silva',
        'Carlos Alberto Santos',
        'Ricardo Mendes',
        'Patrícia Lima',
        'Fernando Gomes',
        'Juliana Ferreira',
        'Roberto Carlos',
        'Amanda Silva',
        'Diego Costa',
        'Fernanda Alves',
        'Gabriel Santos',
        'Larissa Oliveira',
        'Bruno Henrique'
    ]
    
    for i, nome in enumerate(nomes_negociacao):
        protecoes_negociacao.append({
            'id': str(uuid.uuid4()),
            'title': f'Negócio de {nome.split()[0]}',
            'client_name': nome,
            'vehicle': f'XYZ{100+i:04d}',
            'status': 'negociacao',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
    
    # Proteções Aguardando Aprovação (3 cadastros)
    protecoes_aguardando = [
        {
            'id': str(uuid.uuid4()),
            'title': 'Proteção de Rafael',
            'client_name': 'Rafael Carlos Silva Bensch',
            'vehicle': 'DEF5678',
            'status': 'aguardando_aprovacao',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Proteção de Luciana',
            'client_name': 'Luciana Martins',
            'vehicle': 'GHI9012',
            'status': 'aguardando_aprovacao',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Proteção de Eduardo',
            'client_name': 'Eduardo Pereira',
            'vehicle': 'JKL3456',
            'status': 'aguardando_aprovacao',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    ]
    
    # Inserir todas as proteções
    all_protecoes = protecoes_interesse + protecoes_negociacao + protecoes_aguardando
    if all_protecoes:
        await db.labelview_crm_protecoes.insert_many(all_protecoes)
        print(f"✅ {len(all_protecoes)} proteções criadas:")
        print(f"   - Interesse: {len(protecoes_interesse)}")
        print(f"   - Negociação: {len(protecoes_negociacao)}")
        print(f"   - Aguardando Aprovação: {len(protecoes_aguardando)}")
    
    client.close()
    print("\n🎉 Seed CRM completo!")

if __name__ == "__main__":
    asyncio.run(seed_crm_data())
