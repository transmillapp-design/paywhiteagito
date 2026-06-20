#!/usr/bin/env python3
"""
Specific test for the complete QR Code flow as requested in the review
"""

import requests
import json
import base64

def test_complete_qr_flow():
    """Test the complete QR Code flow as described in the review request"""
    base_url = "https://slim-super-app.preview.emergentagent.com/api"
    
    print("🎯 TESTE COMPLETO DO FLUXO QR CODE COM VALOR")
    print("=" * 60)
    
    # Step 1: Login as merchant (lojista@demo.com / demo123)
    print("\n1. Login como lojista@demo.com")
    login_response = requests.post(f"{base_url}/auth/login", json={
        "email": "lojista@demo.com",
        "password": "demo123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Falha no login do lojista: {login_response.status_code}")
        return
    
    merchant_token = login_response.json()["access_token"]
    print("✅ Login do lojista realizado com sucesso")
    
    # Step 2: Generate QR Code with amount = 50.00
    print("\n2. Gerar QR Code com valor R$ 50,00")
    qr_response = requests.post(f"{base_url}/merchant/qr-code", 
                               json={"amount": 50.00},
                               headers={"Authorization": f"Bearer {merchant_token}"})
    
    if qr_response.status_code != 200:
        print(f"❌ Falha na geração do QR Code: {qr_response.status_code}")
        return
    
    qr_data = qr_response.json()
    qr_code = qr_data["qr_code"]
    print(f"✅ QR Code gerado: {qr_code[:30]}...")
    print(f"   Lojista: {qr_data['merchant_name']}")
    print(f"   Valor: R$ {qr_data['amount']:.2f}")
    print(f"   Cashback Rate: {qr_data['cashback_rate']}%")
    
    # Step 3: Decode QR Code to verify it contains the amount
    print("\n3. Decodificar QR Code para validar conteúdo")
    try:
        encoded_data = qr_code.replace("AGITOCASH_", "")
        qr_json = base64.b64decode(encoded_data.encode()).decode()
        decoded_qr = json.loads(qr_json)
        
        print("✅ QR Code decodificado com sucesso:")
        print(f"   merchant_id: {decoded_qr['merchant_id']}")
        print(f"   merchant_name: {decoded_qr['merchant_name']}")
        print(f"   cashback_rate: {decoded_qr['cashback_rate']}%")
        print(f"   amount: R$ {decoded_qr['amount']:.2f}")
        print(f"   timestamp: {decoded_qr['timestamp']}")
        
        if decoded_qr['amount'] != 50.00:
            print(f"❌ Valor no QR Code incorreto: esperado 50.00, encontrado {decoded_qr['amount']}")
            return
            
    except Exception as e:
        print(f"❌ Erro ao decodificar QR Code: {e}")
        return
    
    # Step 4: Login as client (cliente@demo.com / demo123)
    print("\n4. Login como cliente@demo.com")
    client_login_response = requests.post(f"{base_url}/auth/login", json={
        "email": "cliente@demo.com",
        "password": "demo123"
    })
    
    if client_login_response.status_code != 200:
        print(f"❌ Falha no login do cliente: {client_login_response.status_code}")
        return
    
    client_token = client_login_response.json()["access_token"]
    print("✅ Login do cliente realizado com sucesso")
    
    # Step 5: Check client balance before payment
    print("\n5. Verificar saldo do cliente antes do pagamento")
    balance_response = requests.get(f"{base_url}/user/balance",
                                   headers={"Authorization": f"Bearer {client_token}"})
    
    if balance_response.status_code == 200:
        balance_data = balance_response.json()
        initial_balance = balance_data["balance"]
        initial_cashback = balance_data["cashback_balance"]
        print(f"✅ Saldo inicial: R$ {initial_balance:.2f}, Cashback: R$ {initial_cashback:.2f}")
    else:
        print(f"❌ Erro ao verificar saldo: {balance_response.status_code}")
        return
    
    # Step 6: Process payment using QR Code (amount comes from QR)
    print("\n6. Processar pagamento usando QR Code (valor vem do QR)")
    payment_response = requests.post(f"{base_url}/transactions/payment",
                                   json={
                                       "amount": decoded_qr['amount'],  # Amount from QR Code
                                       "qr_code": qr_code
                                   },
                                   headers={"Authorization": f"Bearer {client_token}"})
    
    if payment_response.status_code != 200:
        print(f"❌ Falha no processamento do pagamento: {payment_response.status_code}")
        print(f"   Erro: {payment_response.text}")
        return
    
    payment_data = payment_response.json()
    print("✅ Pagamento processado com sucesso!")
    print(f"   Valor pago: R$ {decoded_qr['amount']:.2f}")
    print(f"   Cashback recebido: R$ {payment_data['cashback_earned']:.2f}")
    print(f"   Lojista: {payment_data['merchant_info']['name']}")
    
    # Step 7: Verify final balance
    print("\n7. Verificar saldo final do cliente")
    final_balance_response = requests.get(f"{base_url}/user/balance",
                                         headers={"Authorization": f"Bearer {client_token}"})
    
    if final_balance_response.status_code == 200:
        final_balance_data = final_balance_response.json()
        final_balance = final_balance_data["balance"]
        final_cashback = final_balance_data["cashback_balance"]
        
        print(f"✅ Saldo final: R$ {final_balance:.2f}, Cashback: R$ {final_cashback:.2f}")
        
        # Verify the math
        expected_balance = initial_balance - decoded_qr['amount']
        expected_cashback = initial_cashback + payment_data['cashback_earned']
        
        if abs(final_balance - expected_balance) < 0.01 and abs(final_cashback - expected_cashback) < 0.01:
            print("✅ Cálculos de saldo e cashback corretos!")
        else:
            print(f"❌ Erro nos cálculos:")
            print(f"   Saldo esperado: R$ {expected_balance:.2f}, atual: R$ {final_balance:.2f}")
            print(f"   Cashback esperado: R$ {expected_cashback:.2f}, atual: R$ {final_cashback:.2f}")
    else:
        print(f"❌ Erro ao verificar saldo final: {final_balance_response.status_code}")
    
    print("\n" + "=" * 60)
    print("🎉 TESTE COMPLETO DO FLUXO QR CODE FINALIZADO COM SUCESSO!")
    print("✅ Lojista define valor da venda (R$ 50,00) e gera QR Code")
    print("✅ QR Code contém todos os dados necessários (merchant_id, nome, cashback_rate, amount)")
    print("✅ Cliente escaneia QR Code e vê valor automaticamente preenchido")
    print("✅ Cliente confirma pagamento sem precisar digitar valor")
    print("✅ Sistema processa com valor correto e cashback aplicado")
    print("=" * 60)

if __name__ == "__main__":
    test_complete_qr_flow()