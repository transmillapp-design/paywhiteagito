#!/usr/bin/env python3
"""
Script para migrar dados únicos de agitocoin para agitomil
"""
from pymongo import MongoClient
import os

def migrate_data():
    """Migrar dados de agitocoin para agitomil"""
    
    # Conectar aos bancos
    client = MongoClient('mongodb://localhost:27017/')
    db_old = client['agitocoin']
    db_new = client['agitomil']
    
    print("🔄 Iniciando migração de agitocoin → agitomil\n")
    
    # Collections para migrar
    collections = ['merchants', 'users', 'services', 'service_providers', 'service_provider_types']
    
    for collection_name in collections:
        print(f"📦 Processando collection: {collection_name}")
        
        collection_old = db_old[collection_name]
        collection_new = db_new[collection_name]
        
        # Contar documentos
        count_old = collection_old.count_documents({})
        count_new_before = collection_new.count_documents({})
        
        print(f"   Origem (agitocoin): {count_old} documentos")
        print(f"   Destino (agitomil) antes: {count_new_before} documentos")
        
        if count_old == 0:
            print(f"   ⏭️  Nenhum documento para migrar\n")
            continue
        
        # Buscar todos os documentos da collection antiga
        docs_old = list(collection_old.find({}))
        
        migrated = 0
        skipped = 0
        
        for doc in docs_old:
            # Verificar se documento já existe no novo banco (por email ou id)
            query = {}
            if 'email' in doc:
                query = {'email': doc['email']}
            elif 'id' in doc:
                query = {'id': doc['id']}
            else:
                # Se não tem identificador único, usar o _id
                query = {'_id': doc['_id']}
            
            existing = collection_new.find_one(query)
            
            if existing:
                skipped += 1
            else:
                # Inserir documento no novo banco
                collection_new.insert_one(doc)
                migrated += 1
                email = doc.get('email', doc.get('id', 'N/A'))
                print(f"   ✅ Migrado: {email}")
        
        count_new_after = collection_new.count_documents({})
        
        print(f"   ✨ Resultado: {migrated} migrados, {skipped} já existiam")
        print(f"   Destino (agitomil) depois: {count_new_after} documentos\n")
    
    # Verificar outras collections que possam existir apenas em agitocoin
    all_collections_old = db_old.list_collection_names()
    print("🔍 Verificando outras collections em agitocoin...")
    
    for col in all_collections_old:
        if col not in collections:
            count = db_old[col].count_documents({})
            print(f"   ⚠️  Collection extra encontrada: {col} ({count} docs)")
            
            if count > 0:
                # Copiar collection inteira se não existir no destino
                if col not in db_new.list_collection_names():
                    docs = list(db_old[col].find({}))
                    db_new[col].insert_many(docs)
                    print(f"   ✅ Collection {col} migrada completamente")
    
    print("\n✅ Migração concluída!")
    print("\n📊 Resumo final:")
    print("=" * 50)
    
    print("\nAGITOMIL (novo banco):")
    for col in db_new.list_collection_names():
        count = db_new[col].count_documents({})
        print(f"   {col}: {count} documentos")
    
    client.close()

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        print(f"❌ Erro durante migração: {e}")
        import traceback
        traceback.print_exc()
