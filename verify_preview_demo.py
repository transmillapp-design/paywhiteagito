#!/usr/bin/env python3
"""
Script de verificação final das contas demo no preview
"""

import requests
import json

PREVIEW_URL = "https://api-decompose-1.preview.emergentagent.com"

def test_demo_accounts():
    """Testa as contas demo no preview"""
    
    accounts = [
        {"email": "cliente@demo.com", "password": "demo123", "type": "cliente"},
        {"email": "lojista@demo.com", "password": "demo123", "type": "lojista"}, 
        {"email": "master@agitocash.com", "password": "master123", "type": "master"}
    ]
    
    print(f"🔄 Testando contas demo no preview: {PREVIEW_URL}")
    print("=" * 60)
    
    all_working = True
    
    for account in accounts:
        try:
            response = requests.post(
                f"{PREVIEW_URL}/api/auth/login",
                headers={"Content-Type": "application/json"},
                json={"email": account["email"], "password": account["password"]},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                print(f"✅ {account['type'].upper()}: {account['email']}")
                print(f"   Nome: {user.get('full_name', 'N/A')}")
                print(f"   Saldo: R$ {user.get('balance', 0):.2f}")
                if account['type'] == 'master':
                    print(f"   Master: {user.get('is_master_account', False)}")
                print()
            else:
                print(f"❌ {account['type'].upper()}: {account['email']} - HTTP {response.status_code}")
                print(f"   Erro: {response.text}")
                print()
                all_working = False
                
        except Exception as e:
            print(f"❌ {account['type'].upper()}: {account['email']} - Erro de conexão")
            print(f"   Detalhes: {str(e)}")
            print()
            all_working = False
    
    print("=" * 60)
    if all_working:
        print("🎉 TODAS AS CONTAS DEMO FUNCIONANDO NO PREVIEW!")
        print("\n📋 CREDENCIAIS PARA O USUÁRIO:")
        print("   Cliente: cliente@demo.com / demo123")
        print("   Lojista: lojista@demo.com / demo123") 
        print("   Master: master@agitocash.com / master123")
    else:
        print("⚠️  Algumas contas apresentaram problemas.")
    
    return all_working

if __name__ == "__main__":
    test_demo_accounts()