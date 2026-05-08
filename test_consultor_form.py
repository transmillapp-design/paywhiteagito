#!/usr/bin/env python3
"""
Test script to verify the consultor endpoint with form data
"""

import requests
import os

def test_consultor_form():
    # Get backend URL from environment
    backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    base_url = f"{backend_url}/api"
    
    # First, login to get token
    login_data = {
        "email": "protecao@agitomil.com",
        "password": "demo123"
    }
    
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        return
    
    token = response.json().get("access_token")
    print(f"✅ Login successful, token: {token[:20]}...")
    
    # Get unidade ID
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{base_url}/labelview/unidades", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get unidades: {response.status_code}")
        return
    
    unidades = response.json().get("unidades", [])
    if not unidades:
        print("❌ No unidades found")
        return
    
    unidade_id = unidades[0]["id"]
    print(f"✅ Using unidade: {unidade_id}")
    
    # Test with form data
    form_data = {
        'natureza': 'cpf',
        'nome': 'João Silva Consultor',
        'cpf': '123.456.789-00',
        'rg': '12.345.678-9',
        'data_nascimento': '1990-01-01',
        'telefone_pf': '(11) 99999-9999',
        'pix_key': '123.456.789-00',
        'pix_key_type': 'cpf',
        'address': 'Rua Teste',
        'city': 'São Paulo',
        'state': 'SP',
        'comissao_mensalidade_tipo': 'valor',
        'comissao_mensalidade_valor': '50.00',
        'unidade_id': unidade_id,
        'email': 'consultor.teste.form@teste.com',
        'password': 'SenhaProvisoria2024!'
    }
    
    print("🔄 Testing with form data...")
    response = requests.post(f"{base_url}/labelview/consultores", data=form_data, headers=headers)
    
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {response.json()}")
    except:
        print(f"Response text: {response.text}")

if __name__ == "__main__":
    test_consultor_form()