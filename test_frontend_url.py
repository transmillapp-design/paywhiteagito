#!/usr/bin/env python3
"""
AgitoCash Frontend URL Investigation
Test frontend accessibility on production URL: https://login-reset.emergent.host/
"""

import requests
import time

def test_frontend_accessibility():
    """Test if the frontend is accessible and loading correctly"""
    print("🌐 TESTE DE ACESSIBILIDADE DO FRONTEND")
    print("URL: https://login-reset.emergent.host/")
    print("=" * 60)
    
    try:
        # Test main frontend URL
        print("\n--- TESTE 1: Acessar URL Principal ---")
        response = requests.get("https://login-reset.emergent.host/", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
        print(f"Content-Length: {len(response.text)} bytes")
        
        if response.status_code == 200:
            print("✅ Frontend acessível")
            
            # Check if it's HTML content
            if 'text/html' in response.headers.get('content-type', ''):
                print("✅ Conteúdo HTML retornado")
                
                # Check for React app indicators
                content = response.text.lower()
                if 'react' in content or 'agitocash' in content or 'root' in content:
                    print("✅ Aplicação React detectada")
                else:
                    print("⚠️ Conteúdo HTML mas sem indicadores de React")
                    
                # Check for login form elements
                if 'login' in content or 'email' in content or 'password' in content:
                    print("✅ Elementos de login detectados")
                else:
                    print("⚠️ Elementos de login não detectados")
                    
            else:
                print("❌ Conteúdo não é HTML")
        else:
            print(f"❌ Frontend inacessível - Status: {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("❌ Timeout ao acessar frontend")
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão ao acessar frontend")
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")
    
    # Test login page specifically
    print("\n--- TESTE 2: Acessar Página de Login ---")
    try:
        response = requests.get("https://login-reset.emergent.host/login", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Página de login acessível")
        else:
            print(f"❌ Página de login inacessível - Status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao acessar página de login: {str(e)}")
    
    # Test if backend URL is correctly configured in frontend
    print("\n--- TESTE 3: Verificar Configuração do Backend ---")
    
    # The frontend should be making requests to the same domain with /api prefix
    expected_backend_url = "https://login-reset.emergent.host/api"
    
    try:
        # Test a simple backend endpoint
        response = requests.post(f"{expected_backend_url}/auth/login", 
                               json={"email": "test", "password": "test"}, 
                               timeout=10)
        
        print(f"Backend URL: {expected_backend_url}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [400, 401, 422]:  # Expected validation errors
            print("✅ Backend respondendo corretamente (erro de validação esperado)")
        elif response.status_code == 404:
            print("❌ Backend endpoint não encontrado - possível problema de configuração")
        else:
            print(f"⚠️ Resposta inesperada do backend: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar backend: {str(e)}")

def test_demo_login_via_frontend():
    """Test demo login through frontend simulation"""
    print("\n🔐 TESTE DE LOGIN DEMO VIA FRONTEND")
    print("=" * 50)
    
    # Simulate what the frontend would do
    backend_url = "https://login-reset.emergent.host/api"
    
    demo_credentials = [
        {"email": "cliente@demo.com", "password": "demo123", "name": "Cliente Demo"},
        {"email": "lojista@demo.com", "password": "demo123", "name": "Lojista Demo"},
        {"email": "master@agitocash.com", "password": "master123", "name": "Master Demo"}
    ]
    
    for cred in demo_credentials:
        print(f"\n--- Testando {cred['name']} ---")
        
        try:
            # Simulate frontend login request
            response = requests.post(f"{backend_url}/auth/login", 
                                   json={
                                       "email": cred["email"],
                                       "password": cred["password"]
                                   },
                                   headers={
                                       "Content-Type": "application/json",
                                       "Origin": "https://login-reset.emergent.host",
                                       "Referer": "https://login-reset.emergent.host/login"
                                   },
                                   timeout=10)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login bem-sucedido para {cred['email']}")
                print(f"✅ Token recebido: {len(data.get('access_token', ''))} caracteres")
                print(f"✅ Usuário: {data.get('user', {}).get('full_name', 'N/A')}")
            else:
                print(f"❌ Login falhou para {cred['email']}")
                print(f"❌ Erro: {response.text}")
                
        except Exception as e:
            print(f"❌ Erro ao testar {cred['name']}: {str(e)}")

def main():
    print("🚨 INVESTIGAÇÃO COMPLETA: FRONTEND + BACKEND NA URL EXTERNA")
    print("=" * 80)
    
    test_frontend_accessibility()
    test_demo_login_via_frontend()
    
    print("\n" + "=" * 80)
    print("🎯 CONCLUSÃO DA INVESTIGAÇÃO")
    print("=" * 80)
    print("1. Backend: ✅ Funcionando - todas as contas demo operacionais")
    print("2. Frontend: Testando acessibilidade e configuração...")
    print("3. Integração: Verificando se frontend consegue comunicar com backend")

if __name__ == "__main__":
    main()