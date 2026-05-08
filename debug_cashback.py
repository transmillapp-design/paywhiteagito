#!/usr/bin/env python3
"""
Debug script to understand cashback distribution issue
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
    elif method.upper() == "PUT":
        response = requests.put(url, json=data, headers=headers)
    
    return response

def debug_cashback_issue():
    print("🔍 DEBUG: Investigando problema de distribuição de cashback")
    print("=" * 60)
    
    # Usar contas demo existentes
    print("\n--- TESTE 1: Login com contas demo ---")
    
    # Login cliente
    client_login = {
        "email": "cliente@demo.com",
        "password": "demo123"
    }
    
    response = make_request("POST", "/auth/login", client_login)
    if response.status_code == 200:
        client_data = response.json()
        client_token = client_data["access_token"]
        client_user = client_data["user"]
        print(f"✅ Cliente logado: {client_user['full_name']}")
        print(f"   Referred by: {client_user.get('referred_by', 'None')}")
    else:
        print(f"❌ Falha no login cliente: {response.status_code}")
        return
    
    # Login lojista
    merchant_login = {
        "email": "lojista@demo.com",
        "password": "demo123"
    }
    
    response = make_request("POST", "/auth/login", merchant_login)
    if response.status_code == 200:
        merchant_data = response.json()
        merchant_token = merchant_data["access_token"]
        merchant_user = merchant_data["user"]
        print(f"✅ Lojista logado: {merchant_user['company_name']}")
        print(f"   Cashback rate: {merchant_user.get('cashback_rate', 0)}%")
        print(f"   Referred by: {merchant_user.get('referred_by', 'None')}")
    else:
        print(f"❌ Falha no login lojista: {response.status_code}")
        return
    
    # Verificar saldos ANTES
    print("\n--- TESTE 2: Saldos ANTES da compra ---")
    
    response = make_request("GET", "/user/balance", token=client_token)
    if response.status_code == 200:
        client_balance_before = response.json()
        print(f"Cliente ANTES: Principal R$ {client_balance_before['balance']:.2f}, Cashback R$ {client_balance_before['cashback_balance']:.2f}")
    
    # Gerar QR Code
    print("\n--- TESTE 3: Gerar QR Code ---")
    
    qr_request = {"amount": 10.00}  # Valor menor para teste
    response = make_request("POST", "/merchant/qr-code", qr_request, token=merchant_token)
    
    if response.status_code == 200:
        qr_data = response.json()
        print(f"✅ QR Code gerado para R$ {qr_data['amount']:.2f}")
        print(f"   Merchant: {qr_data['merchant_name']}")
        print(f"   Cashback rate: {qr_data.get('cashback_rate', 0)}%")
        
        # Calcular cashback esperado
        expected_cashback = qr_data['amount'] * (qr_data.get('cashback_rate', 0) / 100)
        print(f"   Cashback esperado: R$ {expected_cashback:.2f}")
    else:
        print(f"❌ Falha ao gerar QR Code: {response.status_code}")
        return
    
    # Fazer pagamento
    print("\n--- TESTE 4: Processar pagamento ---")
    
    payment_request = {
        "amount": 10.00,
        "qr_code": qr_data["qr_code"]
    }
    
    response = make_request("POST", "/transactions/payment", payment_request, token=client_token)
    
    if response.status_code == 200:
        payment_result = response.json()
        print(f"✅ Pagamento processado")
        print(f"   Response keys: {list(payment_result.keys())}")
        
        # Imprimir resposta completa para debug
        print(f"   Full response: {json.dumps(payment_result, indent=2)}")
    else:
        print(f"❌ Falha no pagamento: {response.status_code}")
        print(f"   Error: {response.text}")
        return
    
    # Verificar saldos DEPOIS
    print("\n--- TESTE 5: Saldos DEPOIS da compra ---")
    
    time.sleep(1)  # Aguardar processamento
    
    response = make_request("GET", "/user/balance", token=client_token)
    if response.status_code == 200:
        client_balance_after = response.json()
        print(f"Cliente DEPOIS: Principal R$ {client_balance_after['balance']:.2f}, Cashback R$ {client_balance_after['cashback_balance']:.2f}")
        
        # Calcular diferenças
        balance_diff = client_balance_after['balance'] - client_balance_before['balance']
        cashback_diff = client_balance_after['cashback_balance'] - client_balance_before['cashback_balance']
        
        print(f"Diferenças: Principal {balance_diff:.2f}, Cashback {cashback_diff:.2f}")
    
    # Verificar histórico de transações
    print("\n--- TESTE 6: Histórico de transações ---")
    
    response = make_request("GET", "/transactions/history", token=client_token)
    if response.status_code == 200:
        transactions = response.json()
        print(f"Total de transações: {len(transactions)}")
        
        # Mostrar últimas transações
        for tx in transactions[-3:]:
            print(f"   {tx['transaction_type']}: R$ {tx['amount']:.2f} - {tx['description']}")
            if tx.get('cashback_amount', 0) > 0:
                print(f"     Cashback: R$ {tx['cashback_amount']:.2f}")

if __name__ == "__main__":
    debug_cashback_issue()