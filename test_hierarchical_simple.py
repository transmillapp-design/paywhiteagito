#!/usr/bin/env python3
import requests
import json

def test_hierarchical_management():
    base_url = "https://slim-super-app.preview.emergentagent.com/api"
    
    print("🚨 TESTE URGENTE: FUNCIONALIDADES DE BLOQUEIO E EXCLUSÃO DE USUÁRIOS HIERÁRQUICOS")
    print("=" * 100)
    
    # Step 1: Login as master
    print("\n--- PASSO 1: Login Master ---")
    login_data = {
        "email": "master@agitocash.com",
        "password": "master123"
    }
    
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login master falhou - Status: {response.status_code}")
        print(f"Erro: {response.text}")
        return
    
    master_data = response.json()
    master_token = master_data["access_token"]
    print("✅ Login master funcionando")
    
    # Step 2: List hierarchical users
    print("\n--- PASSO 2: Listar Usuários Hierárquicos ---")
    headers = {"Authorization": f"Bearer {master_token}"}
    response = requests.get(f"{base_url}/master/hierarchical-users", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Falha ao listar usuários - Status: {response.status_code}")
        print(f"Erro: {response.text}")
        return
    
    users_data = response.json()
    hierarchical_users = users_data.get("users", [])
    total_users = users_data.get("total", 0)
    
    print(f"✅ {total_users} usuários hierárquicos encontrados")
    
    if total_users == 0:
        print("❌ Nenhum usuário hierárquico encontrado para testar")
        return
    
    # Print user details
    print(f"\n   📋 USUÁRIOS HIERÁRQUICOS ENCONTRADOS:")
    for i, user in enumerate(hierarchical_users, 1):
        print(f"      {i}. {user.get('full_name', 'N/A')} ({user.get('hierarchical_role', 'N/A')})")
        print(f"         ID: {user.get('id', 'N/A')}")
        print(f"         Email: {user.get('email', 'N/A')}")
        print(f"         Estado/Cidade: {user.get('state', 'N/A')}/{user.get('city', 'N/A')}")
        print(f"         Ativo: {user.get('is_active', 'N/A')}")
    
    # Step 3: Test blocking/unblocking functionality
    print("\n--- PASSO 3: Testar Bloqueio/Desbloqueio ---")
    
    # Get first active user for testing
    test_user = None
    for user in hierarchical_users:
        if user.get('is_active', True):  # Find an active user
            test_user = user
            break
    
    if not test_user:
        print("❌ Nenhum usuário ativo encontrado para testar")
        return
    
    test_user_id = test_user.get('id')
    test_user_name = test_user.get('full_name', 'N/A')
    
    print(f"✅ Usuário selecionado para teste: {test_user_name}")
    
    # Test 3a: Deactivate user (block)
    print(f"\n   🔒 Testando desativação do usuário {test_user_name}...")
    response = requests.put(f"{base_url}/master/hierarchical-users/{test_user_id}/status?is_active=false", 
                           headers=headers)
    
    if response.status_code == 200:
        print(f"✅ Usuário {test_user_name} desativado com sucesso")
        
        # Verify user is now inactive
        response = requests.get(f"{base_url}/master/hierarchical-users", headers=headers)
        if response.status_code == 200:
            updated_users = response.json().get("users", [])
            updated_user = next((u for u in updated_users if u.get('id') == test_user_id), None)
            
            if updated_user and not updated_user.get('is_active', True):
                print("✅ Status is_active = false confirmado")
            else:
                print("❌ Status não foi atualizado corretamente")
    else:
        print(f"❌ Falha ao desativar usuário - Status: {response.status_code}")
        print(f"Erro: {response.text}")
    
    # Test 3b: Reactivate user (unblock)
    print(f"\n   🔓 Testando reativação do usuário {test_user_name}...")
    response = requests.put(f"{base_url}/master/hierarchical-users/{test_user_id}/status?is_active=true", 
                           headers=headers)
    
    if response.status_code == 200:
        print(f"✅ Usuário {test_user_name} reativado com sucesso")
        
        # Verify user is now active again
        response = requests.get(f"{base_url}/master/hierarchical-users", headers=headers)
        if response.status_code == 200:
            updated_users = response.json().get("users", [])
            updated_user = next((u for u in updated_users if u.get('id') == test_user_id), None)
            
            if updated_user and updated_user.get('is_active', True):
                print("✅ Status is_active = true confirmado")
            else:
                print("❌ Status não foi atualizado corretamente")
    else:
        print(f"❌ Falha ao reativar usuário - Status: {response.status_code}")
        print(f"Erro: {response.text}")
    
    # Step 4: Test deletion functionality
    print("\n--- PASSO 4: Testar Exclusão de Usuário ---")
    
    # Get user count before deletion
    response = requests.get(f"{base_url}/master/hierarchical-users", headers=headers)
    users_before = response.json().get("total", 0) if response.status_code == 200 else 0
    
    # Find a user to delete (preferably not the first one to avoid deleting important data)
    delete_user = None
    if len(hierarchical_users) > 1:
        delete_user = hierarchical_users[1]  # Use second user
    elif len(hierarchical_users) == 1:
        delete_user = hierarchical_users[0]  # Use only user if just one exists
    
    if not delete_user:
        print("❌ Nenhum usuário disponível para exclusão")
    else:
        delete_user_id = delete_user.get('id')
        delete_user_name = delete_user.get('full_name', 'N/A')
        delete_user_role = delete_user.get('hierarchical_role', 'N/A')
        
        print(f"✅ Usuário selecionado para exclusão: {delete_user_name} ({delete_user_role})")
        
        # Perform deletion
        print(f"\n   🗑️ Deletando usuário {delete_user_name}...")
        response = requests.delete(f"{base_url}/master/hierarchical-users/{delete_user_id}", headers=headers)
        
        if response.status_code == 200:
            print(f"✅ Usuário {delete_user_name} deletado com sucesso")
            
            # Verify user count decreased
            response = requests.get(f"{base_url}/master/hierarchical-users", headers=headers)
            if response.status_code == 200:
                users_after = response.json().get("total", 0)
                
                if users_after == users_before - 1:
                    print(f"✅ Contagem de usuários: {users_before} → {users_after}")
                else:
                    print(f"❌ Contagem incorreta: {users_before} → {users_after}")
                    
                # Verify user is no longer in the list
                remaining_users = response.json().get("users", [])
                deleted_user_still_exists = any(u.get('id') == delete_user_id for u in remaining_users)
                
                if not deleted_user_still_exists:
                    print("✅ Usuário removido da lista")
                else:
                    print("❌ Usuário ainda aparece na lista")
        else:
            print(f"❌ Falha ao deletar usuário - Status: {response.status_code}")
            print(f"Erro: {response.text}")
    
    # Step 5: Test security validations
    print("\n--- PASSO 5: Validar Segurança ---")
    
    # Test 5a: Access with non-master user (should return 403)
    print("\n   🔐 Testando acesso com usuário não-master...")
    
    # Try to login as regular client
    client_login_data = {
        "email": "cliente@demo.com",
        "password": "demo123"
    }
    
    response = requests.post(f"{base_url}/auth/login", json=client_login_data)
    
    if response.status_code == 200:
        client_token = response.json()["access_token"]
        client_headers = {"Authorization": f"Bearer {client_token}"}
        
        # Try to access hierarchical users with client token
        response = requests.get(f"{base_url}/master/hierarchical-users", headers=client_headers)
        
        if response.status_code == 403:
            print("✅ Acesso negado para usuário não-master (403)")
        else:
            print(f"❌ Deveria retornar 403, retornou: {response.status_code}")
            
        # Try to modify user status with client token
        if hierarchical_users:
            first_user_id = hierarchical_users[0].get('id')
            response = requests.put(f"{base_url}/master/hierarchical-users/{first_user_id}/status?is_active=false", 
                                   headers=client_headers)
            
            if response.status_code == 403:
                print("✅ Modificação negada para usuário não-master (403)")
            else:
                print(f"❌ Deveria retornar 403, retornou: {response.status_code}")
    else:
        print("❌ Não foi possível fazer login como cliente para teste de segurança")
    
    # Test 5b: Access with invalid user ID (should return 404)
    print("\n   🔍 Testando acesso com ID inexistente...")
    
    fake_user_id = "fake-user-id-12345"
    
    # Try to get non-existent user
    response = requests.get(f"{base_url}/master/hierarchical-users/{fake_user_id}", headers=headers)
    
    if response.status_code == 404:
        print("✅ ID inexistente retorna 404 corretamente")
    else:
        print(f"❌ Deveria retornar 404, retornou: {response.status_code}")
    
    # Try to update status of non-existent user
    response = requests.put(f"{base_url}/master/hierarchical-users/{fake_user_id}/status?is_active=true", 
                           headers=headers)
    
    if response.status_code == 404:
        print("✅ Atualização de ID inexistente retorna 404")
    else:
        print(f"❌ Deveria retornar 404, retornou: {response.status_code}")
    
    # Try to delete non-existent user
    response = requests.delete(f"{base_url}/master/hierarchical-users/{fake_user_id}", headers=headers)
    
    if response.status_code == 404:
        print("✅ Exclusão de ID inexistente retorna 404")
    else:
        print(f"❌ Deveria retornar 404, retornou: {response.status_code}")
    
    print(f"\n🎯 TESTE CONCLUÍDO!")

if __name__ == "__main__":
    test_hierarchical_management()
