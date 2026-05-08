#!/usr/bin/env python3
"""
Debug script to check referral relationships
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
        
    if method.upper() == "GET":
        response = requests.get(url, headers=headers)
    elif method.upper() == "POST":
        response = requests.post(url, json=data, headers=headers)
    
    return response

def debug_referral_relationships():
    print("🔍 DEBUG: Verificando relacionamentos de indicação")
    print("=" * 60)
    
    timestamp = int(time.time())
    
    # Criar Indicador A
    print("\n--- TESTE 1: Criar Indicador A ---")
    
    indicador_a_data = {
        "email": f"debug.indicador.a{timestamp}@email.com",
        "password": "IndicadorA@123",
        "full_name": "Debug Indicador A Silva",
        "phone": "11987654321",
        "user_type": "cliente",
        "cpf": "11144477735"
    }
    
    response = make_request("POST", "/auth/register", indicador_a_data)
    if response.status_code == 200:
        indicador_a = response.json()
        indicador_a_token = indicador_a["access_token"]
        indicador_a_user = indicador_a["user"]
        indicador_a_code = indicador_a_user["referral_code"]
        print(f"✅ Indicador A criado: {indicador_a_user['full_name']}")
        print(f"   Código de indicação: {indicador_a_code}")
        print(f"   ID: {indicador_a_user['id']}")
        print(f"   Referred by: {indicador_a_user.get('referred_by', 'None')}")
    else:
        print(f"❌ Falha ao criar Indicador A: {response.status_code}")
        print(f"   Error: {response.text}")
        return
    
    # Criar Cliente usando código do Indicador A
    print("\n--- TESTE 2: Criar Cliente com código do Indicador A ---")
    
    cliente_data = {
        "email": f"debug.cliente{timestamp}@email.com",
        "password": "Cliente@123",
        "full_name": "Debug Cliente Silva",
        "phone": "11999888777",
        "user_type": "cliente",
        "cpf": "33366699957",
        "referral_code_used": indicador_a_code
    }
    
    response = make_request("POST", "/auth/register", cliente_data)
    if response.status_code == 200:
        cliente = response.json()
        cliente_token = cliente["access_token"]
        cliente_user = cliente["user"]
        print(f"✅ Cliente criado: {cliente_user['full_name']}")
        print(f"   ID: {cliente_user['id']}")
        print(f"   Referred by: {cliente_user.get('referred_by', 'None')}")
        print(f"   Referral code: {cliente_user.get('referral_code', 'None')}")
        
        # Verificar se o referred_by aponta para o Indicador A
        if cliente_user.get('referred_by') == indicador_a_user['id']:
            print("   ✅ Relacionamento de indicação correto!")
        else:
            print("   ❌ Relacionamento de indicação incorreto!")
            print(f"      Esperado: {indicador_a_user['id']}")
            print(f"      Atual: {cliente_user.get('referred_by', 'None')}")
    else:
        print(f"❌ Falha ao criar Cliente: {response.status_code}")
        print(f"   Error: {response.text}")
        return
    
    # Criar Indicador B
    print("\n--- TESTE 3: Criar Indicador B ---")
    
    indicador_b_data = {
        "email": f"debug.indicador.b{timestamp}@email.com",
        "password": "IndicadorB@123",
        "full_name": "Debug Indicador B Santos",
        "phone": "11876543210",
        "user_type": "cliente",
        "cpf": "22255588846"
    }
    
    response = make_request("POST", "/auth/register", indicador_b_data)
    if response.status_code == 200:
        indicador_b = response.json()
        indicador_b_token = indicador_b["access_token"]
        indicador_b_user = indicador_b["user"]
        indicador_b_code = indicador_b_user["referral_code"]
        print(f"✅ Indicador B criado: {indicador_b_user['full_name']}")
        print(f"   Código de indicação: {indicador_b_code}")
        print(f"   ID: {indicador_b_user['id']}")
    else:
        print(f"❌ Falha ao criar Indicador B: {response.status_code}")
        return
    
    # Criar Lojista usando código do Indicador B
    print("\n--- TESTE 4: Criar Lojista com código do Indicador B ---")
    
    lojista_data = {
        "email": f"debug.lojista{timestamp}@loja.com",
        "password": "Lojista@123",
        "full_name": "Debug Lojista",
        "phone": "11888777666",
        "user_type": "lojista",
        "company_name": "Debug Loja Teste Ltda",
        "cnpj": "12345678000199",
        "address": "Rua do Debug, 123 - São Paulo/SP",
        "whatsapp": "11888777666",
        "cashback_rate": 5.0,
        "referral_code_used": indicador_b_code
    }
    
    response = make_request("POST", "/auth/register", lojista_data)
    if response.status_code == 200:
        lojista = response.json()
        lojista_token = lojista["access_token"]
        lojista_user = lojista["user"]
        print(f"✅ Lojista criado: {lojista_user['company_name']}")
        print(f"   ID: {lojista_user['id']}")
        print(f"   Referred by: {lojista_user.get('referred_by', 'None')}")
        print(f"   Cashback rate: {lojista_user.get('cashback_rate', 0)}%")
        
        # Verificar se o referred_by aponta para o Indicador B
        if lojista_user.get('referred_by') == indicador_b_user['id']:
            print("   ✅ Relacionamento de indicação correto!")
        else:
            print("   ❌ Relacionamento de indicação incorreto!")
            print(f"      Esperado: {indicador_b_user['id']}")
            print(f"      Atual: {lojista_user.get('referred_by', 'None')}")
    else:
        print(f"❌ Falha ao criar Lojista: {response.status_code}")
        print(f"   Error: {response.text}")
        return
    
    # Agora fazer um pagamento e verificar a distribuição
    print("\n--- TESTE 5: Fazer pagamento e verificar distribuição ---")
    
    # Adicionar saldo ao cliente
    deposit_data = {"amount": 50.00, "method": "pix"}
    response = make_request("POST", "/transactions/deposit", deposit_data, token=cliente_token)
    if response.status_code == 200:
        print("✅ Saldo adicionado ao cliente")
    
    # Gerar QR Code
    qr_request = {"amount": 20.00}
    response = make_request("POST", "/merchant/qr-code", qr_request, token=lojista_token)
    if response.status_code == 200:
        qr_data = response.json()
        print(f"✅ QR Code gerado para R$ {qr_data['amount']:.2f}")
        print(f"   Cashback rate: {qr_data.get('cashback_rate', 0)}%")
        
        # Calcular cashback esperado
        expected_total_cashback = qr_data['amount'] * (qr_data.get('cashback_rate', 0) / 100)
        print(f"   Total cashback esperado: R$ {expected_total_cashback:.2f}")
        print(f"   Cliente deve receber: R$ {expected_total_cashback * 0.5:.2f}")
        print(f"   Indicador A deve receber: R$ {expected_total_cashback * 0.1:.2f}")
        print(f"   Indicador B deve receber: R$ {expected_total_cashback * 0.1:.2f}")
        print(f"   Plataforma deve receber: R$ {expected_total_cashback * 0.3:.2f}")
    else:
        print(f"❌ Falha ao gerar QR Code: {response.status_code}")
        return
    
    # Verificar saldos ANTES
    print("\n--- Saldos ANTES do pagamento ---")
    
    # Cliente
    response = make_request("GET", "/user/balance", token=cliente_token)
    if response.status_code == 200:
        cliente_balance_before = response.json()
        print(f"Cliente: Principal R$ {cliente_balance_before['balance']:.2f}, Cashback R$ {cliente_balance_before['cashback_balance']:.2f}")
    
    # Indicador A
    response = make_request("GET", "/user/balance", token=indicador_a_token)
    if response.status_code == 200:
        indicador_a_balance_before = response.json()
        print(f"Indicador A: Principal R$ {indicador_a_balance_before['balance']:.2f}, Cashback R$ {indicador_a_balance_before['cashback_balance']:.2f}")
    
    # Indicador B
    response = make_request("GET", "/user/balance", token=indicador_b_token)
    if response.status_code == 200:
        indicador_b_balance_before = response.json()
        print(f"Indicador B: Principal R$ {indicador_b_balance_before['balance']:.2f}, Cashback R$ {indicador_b_balance_before['cashback_balance']:.2f}")
    
    # Fazer pagamento
    payment_request = {
        "amount": 20.00,
        "qr_code": qr_data["qr_code"]
    }
    
    response = make_request("POST", "/transactions/payment", payment_request, token=cliente_token)
    if response.status_code == 200:
        payment_result = response.json()
        print(f"\n✅ Pagamento processado com sucesso!")
        print(f"   Cashback distribution: {payment_result.get('cashback_distribution', {})}")
    else:
        print(f"❌ Falha no pagamento: {response.status_code}")
        print(f"   Error: {response.text}")
        return
    
    # Verificar saldos DEPOIS
    print("\n--- Saldos DEPOIS do pagamento ---")
    
    time.sleep(1)  # Aguardar processamento
    
    # Cliente
    response = make_request("GET", "/user/balance", token=cliente_token)
    if response.status_code == 200:
        cliente_balance_after = response.json()
        cliente_cashback_diff = cliente_balance_after['cashback_balance'] - cliente_balance_before['cashback_balance']
        print(f"Cliente: Principal R$ {cliente_balance_after['balance']:.2f}, Cashback R$ {cliente_balance_after['cashback_balance']:.2f}")
        print(f"   Cashback recebido: R$ {cliente_cashback_diff:.2f}")
    
    # Indicador A
    response = make_request("GET", "/user/balance", token=indicador_a_token)
    if response.status_code == 200:
        indicador_a_balance_after = response.json()
        indicador_a_bonus_diff = indicador_a_balance_after['cashback_balance'] - indicador_a_balance_before['cashback_balance']
        print(f"Indicador A: Principal R$ {indicador_a_balance_after['balance']:.2f}, Cashback R$ {indicador_a_balance_after['cashback_balance']:.2f}")
        print(f"   Bônus recebido: R$ {indicador_a_bonus_diff:.2f}")
    
    # Indicador B
    response = make_request("GET", "/user/balance", token=indicador_b_token)
    if response.status_code == 200:
        indicador_b_balance_after = response.json()
        indicador_b_bonus_diff = indicador_b_balance_after['cashback_balance'] - indicador_b_balance_before['cashback_balance']
        print(f"Indicador B: Principal R$ {indicador_b_balance_after['balance']:.2f}, Cashback R$ {indicador_b_balance_after['cashback_balance']:.2f}")
        print(f"   Bônus recebido: R$ {indicador_b_bonus_diff:.2f}")

if __name__ == "__main__":
    debug_referral_relationships()