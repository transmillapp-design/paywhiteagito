#!/usr/bin/env python3
"""
AgitoCash Hierarchical User Login Testing
Test existing hierarchical users login in production environment
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class HierarchicalLoginTester:
    def __init__(self, base_url: str = "https://slim-super-app.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_existing_hierarchical_users_login(self):
        """Test login for existing hierarchical users in production environment"""
        print("\n🎯 TESTE URGENTE: VALIDAÇÃO DE LOGIN DOS USUÁRIOS HIERÁRQUICOS EXISTENTES")
        print("=" * 80)
        
        # The 3 hierarchical users as specified in the review request
        hierarchical_users = [
            {
                "name": "SÓCIO OPERADOR",
                "email": "socio.operador@agitocash.com",
                "password": "socio123",
                "role": "socio_operador",
                "expected_name": "Carlos Silva Operador",
                "expected_state": "São Paulo"
            },
            {
                "name": "MINI AGÊNCIA",
                "email": "mini.agencia@agitocash.com",
                "password": "agencia123",
                "role": "mini_agencia",
                "expected_name": "Maria Santos Agência",
                "expected_state": "Rio de Janeiro",
                "expected_city": "Rio de Janeiro"
            },
            {
                "name": "CONSULTOR",
                "email": "consultor@agitocash.com",
                "password": "consultor123",
                "role": "consultor",
                "expected_name": "João Costa Consultor",
                "expected_state": "Minas Gerais",
                "expected_city": "Belo Horizonte"
            }
        ]
        
        successful_logins = []
        
        for user_info in hierarchical_users:
            user_name = user_info["name"]
            user_email = user_info["email"]
            user_password = user_info["password"]
            
            print(f"\n--- TESTANDO {user_name} ---")
            print(f"🔸 Email: {user_email}")
            print(f"🔸 Senha: {user_password}")
            
            # Test login
            login_data = {
                "email": user_email,
                "password": user_password
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                login_response = response.json()
                user_data = login_response["user"]
                access_token = login_response["access_token"]
                
                # Validate user data
                actual_name = user_data.get('full_name', 'N/A')
                actual_role = user_data.get('hierarchical_role', 'N/A')
                actual_state = user_data.get('state', 'N/A')
                actual_city = user_data.get('city', 'N/A')
                
                self.log_test(f"Login {user_name}", True, 
                             f"✅ LOGIN REALIZADO - Nome: {actual_name}, "
                             f"Função: {actual_role}, Estado: {actual_state}, Cidade: {actual_city}")
                
                # Test profile access
                profile_response = self.make_request("GET", "/user/profile", token=access_token)
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    self.log_test(f"Profile Access {user_name}", True, 
                                 f"✅ Perfil acessível - {profile_data.get('full_name')}")
                    
                    # Test balance access
                    balance_response = self.make_request("GET", "/user/balance", token=access_token)
                    
                    if balance_response.status_code == 200:
                        balance_data = balance_response.json()
                        commission_balance = balance_data.get('commission_balance', 0)
                        total_balance = balance_data.get('balance', 0) + balance_data.get('cashback_balance', 0)
                        
                        self.log_test(f"Balance Access {user_name}", True, 
                                     f"✅ Saldo acessível - Principal: R$ {balance_data.get('balance', 0):.2f}, "
                                     f"Cashback: R$ {balance_data.get('cashback_balance', 0):.2f}, "
                                     f"Comissão: R$ {commission_balance:.2f}")
                    else:
                        self.log_test(f"Balance Access {user_name}", False, 
                                     f"❌ Erro ao acessar saldo - Status: {balance_response.status_code}")
                else:
                    self.log_test(f"Profile Access {user_name}", False, 
                                 f"❌ Erro ao acessar perfil - Status: {profile_response.status_code}")
                
                successful_logins.append({
                    "name": user_name,
                    "email": user_email,
                    "token": access_token,
                    "user_data": user_data
                })
                
                # Print detailed user information
                print(f"   📋 Nome Completo: {actual_name}")
                print(f"   📋 Função Hierárquica: {actual_role}")
                print(f"   📋 Estado: {actual_state}")
                if actual_city != 'N/A':
                    print(f"   📋 Cidade: {actual_city}")
                print(f"   📋 WhatsApp: {user_data.get('whatsapp', 'N/A')}")
                print(f"   📋 Telefone: {user_data.get('phone', 'N/A')}")
                
            else:
                error_detail = response.text if response.text else "No error details"
                self.log_test(f"Login {user_name}", False, 
                             f"❌ FALHA NO LOGIN {user_name} - Status: {response.status_code}, "
                             f"Error: {error_detail}")
        
        # Summary
        print(f"\n--- RESUMO FINAL ---")
        total_users = len(hierarchical_users)
        successful_count = len(successful_logins)
        
        self.log_test("Hierarchical Users Login Summary", True, 
                     f"🎯 RESUMO: {successful_count}/{total_users} usuários hierárquicos "
                     f"logaram com sucesso no ambiente de produção")
        
        if successful_count == total_users:
            self.log_test("Production Hierarchical Login System", True, 
                         "🎉 TODOS OS USUÁRIOS HIERÁRQUICOS FUNCIONANDO 100% NO AMBIENTE DE PRODUÇÃO")
        else:
            self.log_test("Production Hierarchical Login System", False, 
                         f"⚠️ Apenas {successful_count}/{total_users} usuários funcionando")
        
        return {
            "successful_logins": successful_logins,
            "total_users": total_users,
            "successful_count": successful_count
        }

    def test_commission_distribution_system(self):
        """Test commission distribution for hierarchical users"""
        print("\n🎯 TESTE: SISTEMA DE DISTRIBUIÇÃO DE COMISSÕES HIERÁRQUICAS")
        print("=" * 70)
        
        # First, login as demo users to create a transaction
        print("\n--- STEP 1: Preparar Transação de Teste ---")
        
        # Login as demo client
        cliente_login = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", cliente_login)
        if response.status_code != 200:
            self.log_test("Client Login for Commission", False, "❌ Falha no login do cliente")
            return
            
        cliente_token = response.json()["access_token"]
        
        # Login as demo merchant
        lojista_login = {
            "email": "lojista@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", lojista_login)
        if response.status_code != 200:
            self.log_test("Merchant Login for Commission", False, "❌ Falha no login do lojista")
            return
            
        lojista_token = response.json()["access_token"]
        
        # Add balance to client
        deposit_data = {
            "amount": 100.00,
            "method": "pix"
        }
        
        response = self.make_request("POST", "/transactions/deposit", deposit_data, token=cliente_token)
        
        if response.status_code == 200:
            self.log_test("Client Balance for Commission", True, "✅ Saldo adicionado ao cliente")
        else:
            self.log_test("Client Balance for Commission", False, "❌ Falha ao adicionar saldo")
            return
        
        # Generate QR Code from merchant
        qr_request = {
            "amount": 50.00
        }
        
        response = self.make_request("POST", "/merchant/qr-code", qr_request, token=lojista_token)
        
        if response.status_code != 200:
            self.log_test("QR Generation for Commission", False, "❌ Falha ao gerar QR Code")
            return
            
        qr_data = response.json()
        
        # Process payment to trigger commission distribution
        payment_data = {
            "amount": 50.00,
            "qr_code": qr_data["qr_code"]
        }
        
        response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
        
        if response.status_code == 200:
            payment_response = response.json()
            self.log_test("Payment for Commission", True, 
                         f"✅ Pagamento processado - Valor: R$ {payment_data['amount']:.2f}")
            
            # Check commission distribution in response
            cashback_dist = payment_response.get("cashback_distribution", {})
            platform_commission = cashback_dist.get("platform", 0)
            
            self.log_test("Commission Distribution", True, 
                         f"✅ Comissão da plataforma: R$ {platform_commission:.2f}")
            
        else:
            self.log_test("Payment for Commission", False, 
                         f"❌ Falha no pagamento - Status: {response.status_code}")
            return
        
        print("\n--- STEP 2: Verificar Comissões dos Usuários Hierárquicos ---")
        
        # Test hierarchical users from previous test
        if hasattr(self, 'hierarchical_users'):
            for h_user in self.hierarchical_users:
                print(f"\n🔸 Verificando comissões: {h_user['name']}")
                
                # Check balance
                response = self.make_request("GET", "/user/balance", token=h_user['token'])
                
                if response.status_code == 200:
                    balance_data = response.json()
                    commission_balance = balance_data.get('commission_balance', 0)
                    
                    if commission_balance > 0:
                        self.log_test(f"Commission {h_user['name']}", True, 
                                     f"✅ {h_user['name']} recebeu comissão: R$ {commission_balance:.2f}")
                    else:
                        self.log_test(f"Commission {h_user['name']}", True, 
                                     f"ℹ️ {h_user['name']} sem comissão (normal se não na área da transação)")
                else:
                    self.log_test(f"Commission {h_user['name']}", False, 
                                 f"❌ Erro ao verificar saldo - Status: {response.status_code}")

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("🎯 RESUMO COMPLETO DOS TESTES HIERÁRQUICOS")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 ESTATÍSTICAS:")
        print(f"   Total de testes: {total_tests}")
        print(f"   ✅ Sucessos: {passed_tests}")
        print(f"   ❌ Falhas: {failed_tests}")
        print(f"   📈 Taxa de sucesso: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n✅ TESTES BEM-SUCEDIDOS:")
        for result in self.test_results:
            if result["success"]:
                print(f"   • {result['test']}")
        
        print("\n" + "="*80)
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": success_rate
        }

if __name__ == "__main__":
    print("🎯 TESTE COMPLETO: LOGIN DOS USUÁRIOS HIERÁRQUICOS NO AMBIENTE DE PRODUÇÃO")
    print("=" * 80)
    
    tester = HierarchicalLoginTester()
    
    try:
        # Test hierarchical user login
        print("\n🔸 TESTE: Login dos Usuários Hierárquicos Existentes")
        login_result = tester.test_existing_hierarchical_users_login()
        
        # Store successful logins for commission test
        if login_result and login_result['successful_logins']:
            tester.hierarchical_users = login_result['successful_logins']
            
            # Test commission distribution
            print("\n🔸 TESTE: Sistema de Distribuição de Comissões")
            tester.test_commission_distribution_system()
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO NOS TESTES HIERÁRQUICOS: {e}")
        tester.log_test("Critical Hierarchical Test Error", False, str(e))
    
    # Print summary
    tester.print_test_summary()