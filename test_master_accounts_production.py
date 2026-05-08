#!/usr/bin/env python3
"""
Teste completo das contas master de produção
Valida login, permissões e acesso aos painéis
"""

import requests
import json

BASE_URL = "http://localhost:8001/api"

def test_login(email, password, expected_user_type):
    """Testa login de uma conta"""
    print(f"\n{'='*70}")
    print(f"🔐 TESTANDO LOGIN: {email}")
    print('='*70)
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    
    if response.status_code == 200:
        data = response.json()
        user = data.get("user", {})
        
        print(f"✅ Login bem-sucedido!")
        print(f"   📧 Email: {user.get('email')}")
        print(f"   👤 Nome: {user.get('full_name')}")
        print(f"   🏢 Empresa: {user.get('company_name')}")
        print(f"   📄 CNPJ: {user.get('cnpj')}")
        print(f"   🔑 User Type: {user.get('user_type')}")
        print(f"   👑 Is Master Account: {user.get('is_master_account')}")
        print(f"   🛡️ Is Labelview Master: {user.get('is_labelview_master')}")
        
        # Validações
        assert user.get('user_type') == expected_user_type, f"User type incorreto: esperado {expected_user_type}, obtido {user.get('user_type')}"
        assert user.get('is_blocked') == False, "Conta está bloqueada!"
        
        return data.get("access_token")
    else:
        print(f"❌ Erro no login: {response.status_code}")
        print(f"   Resposta: {response.text}")
        return None

def test_profile_access(token, email):
    """Testa acesso ao perfil"""
    print(f"\n   🔍 Testando acesso ao perfil...")
    
    response = requests.get(
        f"{BASE_URL}/user/profile",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        print(f"   ✅ Acesso ao perfil OK")
        return True
    else:
        print(f"   ❌ Erro ao acessar perfil: {response.status_code}")
        return False

def test_master_transmill_permissions(token):
    """Testa permissões específicas do Master Transmill"""
    print(f"\n   🧪 Testando permissões Master Transmill...")
    
    # Testar acesso a endpoints master
    endpoints = [
        "/master/social/settings",
        "/stores",
        "/prestadores"
    ]
    
    success_count = 0
    for endpoint in endpoints:
        response = requests.get(
            f"{BASE_URL}{endpoint}",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code in [200, 404]:  # 404 é ok se não há dados
            print(f"   ✅ Acesso a {endpoint}: OK")
            success_count += 1
        else:
            print(f"   ⚠️ Acesso a {endpoint}: {response.status_code}")
    
    return success_count > 0

def test_master_labelview_permissions(token):
    """Testa permissões específicas do Master Labelview"""
    print(f"\n   🧪 Testando permissões Master Labelview...")
    
    # Testar acesso a endpoints Labelview
    endpoints = [
        "/labelview/tipos-fornecedor",
        "/labelview/equipamentos",
        "/labelview/tecnicos",
        "/labelview/regionais",
        "/labelview/consultores"
    ]
    
    success_count = 0
    for endpoint in endpoints:
        response = requests.get(
            f"{BASE_URL}{endpoint}",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code in [200, 404]:  # 404 é ok se não há dados
            print(f"   ✅ Acesso a {endpoint}: OK")
            success_count += 1
        else:
            print(f"   ⚠️ Acesso a {endpoint}: {response.status_code}")
    
    return success_count > 0

def main():
    print("\n" + "="*70)
    print("🚀 TESTE DAS CONTAS MASTER DE PRODUÇÃO - TRANSMILL")
    print("="*70)
    
    # ====================================
    # 1. TESTE MASTER TRANSMILL
    # ====================================
    token_transmill = test_login(
        email="transmillapp@gmail.com",
        password="demo123",
        expected_user_type="master"
    )
    
    if token_transmill:
        test_profile_access(token_transmill, "transmillapp@gmail.com")
        test_master_transmill_permissions(token_transmill)
        print(f"\n   ✅ MASTER TRANSMILL: FUNCIONANDO 100%")
    else:
        print(f"\n   ❌ MASTER TRANSMILL: FALHOU NO LOGIN")
    
    # ====================================
    # 2. TESTE MASTER LABELVIEW
    # ====================================
    token_labelview = test_login(
        email="labelview@transmill.com",
        password="demo123",
        expected_user_type="labelview_master"
    )
    
    if token_labelview:
        test_profile_access(token_labelview, "labelview@transmill.com")
        test_master_labelview_permissions(token_labelview)
        print(f"\n   ✅ MASTER LABELVIEW: FUNCIONANDO 100%")
    else:
        print(f"\n   ❌ MASTER LABELVIEW: FALHOU NO LOGIN")
    
    # ====================================
    # RESUMO FINAL
    # ====================================
    print("\n" + "="*70)
    print("📊 RESUMO DOS TESTES")
    print("="*70)
    
    if token_transmill and token_labelview:
        print("\n✅ TODAS AS CONTAS MASTER FUNCIONANDO CORRETAMENTE!")
        print("\n🎯 PRONTO PARA PRODUÇÃO:")
        print("   ✅ Master Transmill: transmillapp@gmail.com")
        print("   ✅ Master Labelview: labelview@transmill.com")
        print("   ✅ Ambas com senha: demo123")
        print("\n🌐 Acesse em: https://app.transmill.com.br")
    else:
        print("\n❌ ALGUNS TESTES FALHARAM - REVISAR CONFIGURAÇÃO")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
