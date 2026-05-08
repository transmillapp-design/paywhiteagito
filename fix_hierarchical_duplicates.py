#!/usr/bin/env python3
"""
Script para corrigir duplicação de dados hierárquicos
"""

import pymongo
import os

def fix_hierarchical_duplicates():
    """Corrige duplicação de dados hierárquicos"""
    
    try:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        print(f"🔄 Conectando ao MongoDB: {mongo_url}")
        
        client = pymongo.MongoClient(mongo_url)
        db = client.agitocoin
        
        print('🔧 CORREÇÃO DE DADOS HIERÁRQUICOS DUPLICADOS')
        print('=' * 60)
        
        # 1. Listar dados antes
        before_users = list(db.users.find({'user_type': 'hierarchical'}))
        print(f'1. REGISTROS ANTES: {len(before_users)}')
        
        for user in before_users:
            print(f'   {user.get("email")} - {user.get("full_name")} - {user.get("hierarchical_role")}')
        
        # 2. Remover duplicatas antigas (agitocash.com)
        emails_to_remove = [
            'consultor@agitocash.com',
            'mini.agencia@agitocash.com', 
            'socio.operador@agitocash.com'
        ]
        
        print(f'\n2. REMOVENDO DUPLICATAS:')
        total_removed = 0
        
        for email in emails_to_remove:
            result = db.users.delete_many({'email': email})
            total_removed += result.deleted_count
            print(f'   ✅ Removido {email}: {result.deleted_count} registros')
        
        # 3. Ativar usuários corretos 
        print(f'\n3. ATIVANDO USUÁRIOS CORRETOS:')
        emails_to_activate = [
            'consultor@agitocoin.com',
            'mini.agencia@agitocoin.com',
            'socio.operador@agitocoin.com'
        ]
        
        for email in emails_to_activate:
            # Usar $set corretamente
            result = db.users.update_many(
                {'email': email}, 
                {'$set': {'is_active': True}}
            )
            print(f'   ✅ Ativado {email}: {result.modified_count} registros')
        
        # 4. Verificar resultado
        after_users = list(db.users.find({'user_type': 'hierarchical'}))
        print(f'\n4. REGISTROS APÓS: {len(after_users)}')
        
        for user in after_users:
            active = user.get('is_active', False)
            status = '🟢 ATIVO' if active else '🔴 INATIVO'
            print(f'   {user.get("email")} - {user.get("full_name")} - {status}')
        
        # 5. Validar resultado
        print(f'\n5. VALIDAÇÃO:')
        print(f'   Removidos: {total_removed} registros duplicados')
        print(f'   Restantes: {len(after_users)} registros únicos')
        
        # Verificar duplicatas por email
        emails = [u['email'] for u in after_users]
        unique_emails = set(emails)
        
        if len(emails) == len(unique_emails):
            print(f'   ✅ Nenhuma duplicata restante')
        else:
            print(f'   ❌ Ainda há duplicatas!')
        
        # Verificar se todos estão ativos
        active_count = sum(1 for u in after_users if u.get('is_active'))
        print(f'   📊 Usuários ativos: {active_count}/{len(after_users)}')
        
        client.close()
        print('\n🎉 CORREÇÃO DE DUPLICATAS CONCLUÍDA!')
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

if __name__ == "__main__":
    fix_hierarchical_duplicates()