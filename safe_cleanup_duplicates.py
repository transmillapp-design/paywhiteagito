#!/usr/bin/env python3
"""
Script para limpeza segura de dados hierárquicos duplicados
Baseado em melhores práticas MongoDB para remoção de duplicatas
"""

import requests
import json
import time

def safe_cleanup_hierarchical_duplicates():
    """Limpeza segura de duplicatas hierárquicas via API"""
    
    # URL da API externa
    api_url = "https://test-auth-fix-1.emergent.host/api"
    
    print('🔧 LIMPEZA SEGURA DE DUPLICATAS HIERÁRQUICAS')
    print('=' * 60)
    print(f'API URL: {api_url}')
    print('=' * 60)
    
    try:
        # 1. Login com conta master
        print('1. LOGIN MASTER:')
        login_data = {
            "email": "master@agitocoin.com", 
            "password": "master123"
        }
        
        login_response = requests.post(f"{api_url}/auth/login", json=login_data)
        
        if login_response.status_code != 200:
            print(f'❌ Falha no login: {login_response.status_code}')
            return False
            
        master_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {master_token}"}
        print('✅ Login master OK')
        
        # 2. Buscar usuários hierárquicos atuais
        print('\n2. ANÁLISE DE DUPLICATAS:')
        users_response = requests.get(f"{api_url}/master/hierarchical-users", headers=headers)
        
        if users_response.status_code != 200:
            print(f'❌ Erro ao buscar usuários: {users_response.status_code}')
            return False
            
        users_data = users_response.json()
        hierarchical_users = users_data.get("users", [])
        
        print(f'   Total de usuários encontrados: {len(hierarchical_users)}')
        
        # 3. Identificar duplicatas por ID
        id_groups = {}
        for user in hierarchical_users:
            user_id = user.get('id')
            if user_id in id_groups:
                id_groups[user_id].append(user)
            else:
                id_groups[user_id] = [user]
        
        # 4. Encontrar duplicatas
        duplicates_found = []
        for user_id, users_list in id_groups.items():
            if len(users_list) > 1:
                duplicates_found.append((user_id, users_list))
        
        if not duplicates_found:
            print('✅ Nenhuma duplicata encontrada!')
            return True
        
        print(f'   Duplicatas encontradas: {len(duplicates_found)} grupos')
        
        # 5. Para cada grupo de duplicatas, remover o registro antigo
        print('\n3. REMOÇÃO SEGURA DE DUPLICATAS:')
        
        for user_id, users_list in duplicates_found:
            print(f'\n   ID: {user_id} ({len(users_list)} registros)')
            
            # Ordenar por data de criação para manter o mais recente
            users_sorted = sorted(users_list, key=lambda x: x.get('created_at', ''), reverse=True)
            
            # Manter o primeiro (mais recente) e remover os outros
            keep_user = users_sorted[0]
            remove_users = users_sorted[1:]
            
            print(f'   ✅ MANTER: {keep_user.get("email")} ({keep_user.get("created_at", "N/A")[:10]})')
            
            for remove_user in remove_users:
                user_email = remove_user.get('email')
                user_mongo_id = remove_user.get('_id')  # MongoDB ObjectId para deleção
                
                print(f'   🗑️ REMOVER: {user_email} ({remove_user.get("created_at", "N/A")[:10]})')
                
                # Fazer deleção via API (se houver endpoint) ou via email
                if user_email:
                    # Tentativa 1: Deletar via ID específico se API permitir
                    try:
                        delete_response = requests.delete(
                            f"{api_url}/master/hierarchical-users/{remove_user.get('id')}", 
                            headers=headers
                        )
                        
                        if delete_response.status_code == 200:
                            print(f'      ✅ Removido via API: {user_email}')
                        else:
                            print(f'      ⚠️ API delete falhou para {user_email}: {delete_response.status_code}')
                            
                    except Exception as e:
                        print(f'      ❌ Erro ao remover {user_email}: {str(e)}')
        
        # 6. Verificar resultado final
        print('\n4. VERIFICAÇÃO FINAL:')
        final_response = requests.get(f"{api_url}/master/hierarchical-users", headers=headers)
        
        if final_response.status_code == 200:
            final_users = final_response.json().get("users", [])
            print(f'   Usuários após limpeza: {len(final_users)}')
            
            # Verificar se ainda há duplicatas
            final_ids = [u.get('id') for u in final_users]
            unique_final_ids = set(final_ids)
            
            if len(final_ids) == len(unique_final_ids):
                print('   ✅ LIMPEZA CONCLUÍDA - Nenhuma duplicata restante')
                
                # Listar usuários finais
                for user in final_users:
                    status = '🟢 ATIVO' if not user.get('is_blocked', False) else '🔴 BLOQUEADO'
                    print(f'   {user.get("email"):<35} | {user.get("full_name"):<25} | {status}')
                    
                return True
            else:
                print('   ❌ Ainda há duplicatas após limpeza')
                return False
        else:
            print(f'   ❌ Erro na verificação final: {final_response.status_code}')
            return False
            
    except Exception as e:
        print(f'❌ Erro geral: {str(e)}')
        return False

if __name__ == "__main__":
    success = safe_cleanup_hierarchical_duplicates()
    if success:
        print('\n🎉 LIMPEZA DE DUPLICATAS CONCLUÍDA COM SUCESSO!')
    else:
        print('\n❌ LIMPEZA DE DUPLICATAS FALHOU - Verificar logs acima')