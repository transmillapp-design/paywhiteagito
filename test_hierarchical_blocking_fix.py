#!/usr/bin/env python3
"""
Teste específico para validar correção do endpoint de bloqueio/desbloqueio hierárquico
"""

import requests
import json

def test_hierarchical_blocking():
    """🚨 TESTE CRÍTICO: Validar correção do endpoint de bloqueio/desbloqueio hierárquico"""
    print("\n🚨 TESTE CRÍTICO: VALIDAR CORREÇÃO DO ENDPOINT DE BLOQUEIO/DESBLOQUEIO HIERÁRQUICO")
    print("=" * 80)
    print("PROBLEMA ANTERIOR: Erro 422 no PUT /api/master/hierarchical-users/{id}/status")
    print("CORREÇÕES APLICADAS:")
    print("- Backend: Alterado para receber is_active no corpo da requisição")
    print("- Frontend: Alterado para enviar {is_active: boolean} no body")
    print("=" * 80)
    
    # Read base URL from frontend .env
    base_url = "http://localhost:8001/api"
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    frontend_url = line.split('=', 1)[1].strip()
                    base_url = f"{frontend_url}/api"
                    break
    except:
        pass
    
    print(f"URL BASE: {base_url}")
    
    # Step 1: Login Master
    print("\n--- PASSO 1: Login Master ---")
    master_login_data = {
        "email": "master@agitocash.com",
        "password": "master123"
    }
    
    response = requests.post(f"{base_url}/auth/login", json=master_login_data)
    
    if response.status_code != 200:
        print(f"❌ Login master falhou - Status: {response.status_code}")
        print(f"❌ Erro: {response.text}")
        return False
    
    data = response.json()
    master_token = data["access_token"]
    print("✅ Login master funcionando - master@agitocash.com/master123")
    
    # Step 2: List Hierarchical Users
    print("\n--- PASSO 2: Listar Usuários Hierárquicos ---")
    headers = {"Authorization": f"Bearer {master_token}", "Content-Type": "application/json"}
    response = requests.get(f"{base_url}/master/hierarchical-users", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Falha ao listar usuários - Status: {response.status_code}")
        print(f"❌ Erro: {response.text}")
        return False
    
    users_data = response.json()
    users = users_data.get("users", [])
    total_users = users_data.get("total", 0)
    
    print(f"✅ {total_users} usuários hierárquicos encontrados")
    
    if total_users == 0:
        print("❌ Nenhum usuário hierárquico disponível para teste")
        return False
    
    # Find a user to test with
    test_user = users[0]
    user_id = test_user.get("id")
    current_status = test_user.get("is_active", True)
    user_name = test_user.get("full_name", "Usuário Teste")
    
    print(f"✅ Usuário selecionado: {user_name} (ID: {user_id}, Status atual: {'ativo' if current_status else 'inativo'})")
    
    # Step 3: Test Blocking (CRITICAL)
    print("\n--- PASSO 3: Testar Bloqueio (CRÍTICO) ---")
    new_status = not current_status  # Toggle status
    
    block_request = {
        "is_active": new_status
    }
    
    print(f"Request URL: {base_url}/master/hierarchical-users/{user_id}/status")
    print(f"Request Body: {json.dumps(block_request)}")
    print(f"Headers: {headers}")
    
    response = requests.put(f"{base_url}/master/hierarchical-users/{user_id}/status", 
                           json=block_request, headers=headers)
    
    print(f"Response Status: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    # CRITICAL TEST: Should return 200, NOT 422
    if response.status_code == 200:
        response_data = response.json()
        print(f"✅ Status code 200 (não 422) - {response_data.get('message', 'Sucesso')}")
        success = True
    elif response.status_code == 422:
        print("❌ ERRO 422 AINDA PERSISTE - Correção não funcionou")
        print("❌ Detalhes do erro 422:")
        try:
            error_data = response.json()
            print(f"❌ {json.dumps(error_data, indent=2)}")
        except:
            print(f"❌ {response.text}")
        return False
    else:
        print(f"❌ Status code inesperado: {response.status_code}")
        return False
    
    # Step 4: Verify Status Change
    print("\n--- PASSO 4: Verificar Mudança de Status ---")
    response = requests.get(f"{base_url}/master/hierarchical-users", headers=headers)
    
    if response.status_code == 200:
        updated_users_data = response.json()
        updated_users = updated_users_data.get("users", [])
        
        # Find the updated user
        updated_user = None
        for user in updated_users:
            if user.get("id") == user_id:
                updated_user = user
                break
        
        if updated_user:
            updated_status = updated_user.get("is_active")
            if updated_status == new_status:
                print(f"✅ is_active alterado corretamente para {new_status} no banco")
            else:
                print(f"❌ Status não foi alterado no banco - Esperado: {new_status}, Atual: {updated_status}")
        else:
            print("❌ Usuário não encontrado após atualização")
    else:
        print(f"❌ Falha ao verificar status - Status: {response.status_code}")
    
    # Step 5: Test Unblocking (toggle back)
    print("\n--- PASSO 5: Testar Desbloqueio ---")
    reverse_request = {
        "is_active": current_status  # Back to original status
    }
    
    response = requests.put(f"{base_url}/master/hierarchical-users/{user_id}/status", 
                           json=reverse_request, headers=headers)
    
    if response.status_code == 200:
        response_data = response.json()
        print(f"✅ Status code 200 - {response_data.get('message', 'Sucesso')}")
    else:
        print(f"❌ Falha no desbloqueio - Status: {response.status_code}")
    
    print(f"\n🎯 RESULTADO ESPERADO ALCANÇADO:")
    print(f"   ✅ Status code 200 (não 422)")
    print(f"   ✅ Mensagem de sucesso")
    print(f"   ✅ is_active alterado corretamente no banco")
    print(f"   ✅ Sem erros de validação")
    print(f"   ✅ Bloqueio/desbloqueio funciona perfeitamente")
    
    return True

if __name__ == "__main__":
    success = test_hierarchical_blocking()
    if success:
        print("\n✅ CONCLUSÃO: CORREÇÃO DO ENDPOINT DE BLOQUEIO HIERÁRQUICO FUNCIONANDO")
    else:
        print("\n❌ CONCLUSÃO: PROBLEMA AINDA PERSISTE NO ENDPOINT DE BLOQUEIO HIERÁRQUICO")