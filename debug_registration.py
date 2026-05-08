#!/usr/bin/env python3
"""
Debug script to check registration data
"""

import requests
import json
import time

def make_request(method, endpoint, data=None, token=None):
    """Make HTTP request with optional authentication"""
    url = f"https://login-reset.emergent.host/api{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    if method.upper() == "POST":
        response = requests.post(url, json=data, headers=headers)
    
    return response

def debug_registration():
    print("🔍 DEBUG: Verificando dados de registro")
    print("=" * 60)
    
    timestamp = int(time.time())
    
    # Criar lojista com cashback_rate explícito
    print("\n--- TESTE: Criar Lojista com cashback_rate ---")
    
    lojista_data = {
        "email": f"debug.lojista.cashback{timestamp}@loja.com",
        "password": "Lojista@123",
        "full_name": "Debug Lojista Cashback",
        "phone": "11888777666",
        "user_type": "lojista",
        "company_name": "Debug Loja Cashback Ltda",
        "cnpj": "12345678000199",
        "address": "Rua do Debug, 123 - São Paulo/SP",
        "whatsapp": "11888777666",
        "cashback_rate": 7.5  # Explicitamente definindo 7.5%
    }
    
    print(f"Dados enviados:")
    print(json.dumps(lojista_data, indent=2))
    
    response = make_request("POST", "/auth/register", lojista_data)
    
    print(f"\nStatus da resposta: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        user_data = result.get("user", {})
        
        print(f"✅ Lojista criado com sucesso!")
        print(f"   Company: {user_data.get('company_name')}")
        print(f"   Cashback rate: {user_data.get('cashback_rate', 'NOT SET')}%")
        print(f"   User type: {user_data.get('user_type')}")
        
        # Fazer login para verificar os dados salvos
        login_data = {
            "email": lojista_data["email"],
            "password": lojista_data["password"]
        }
        
        login_response = make_request("POST", "/auth/login", login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            login_user_data = login_result.get("user", {})
            
            print(f"\n--- Dados após login ---")
            print(f"   Company: {login_user_data.get('company_name')}")
            print(f"   Cashback rate: {login_user_data.get('cashback_rate', 'NOT SET')}%")
            print(f"   User type: {login_user_data.get('user_type')}")
            
            # Imprimir todos os campos do usuário para debug
            print(f"\n--- Todos os campos do usuário ---")
            for key, value in login_user_data.items():
                print(f"   {key}: {value}")
        else:
            print(f"❌ Falha no login: {login_response.status_code}")
    else:
        print(f"❌ Falha no registro: {response.status_code}")
        print(f"   Error: {response.text}")

if __name__ == "__main__":
    debug_registration()