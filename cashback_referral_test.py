#!/usr/bin/env python3
"""
AgitoCash Cashback Distribution Testing Suite with Referral Setup
Tests cashback distribution with proper referral relationships
"""

import requests
import json
import time
import uuid
from typing import Dict, Any

class CashbackReferralTester:
    def __init__(self, base_url: str = "https://login-reset.emergent.host/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tokens = {}
        self.users = {}
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def create_test_users_with_referrals(self):
        """Create test users with referral relationships"""
        print("\n=== CREATING TEST USERS WITH REFERRAL RELATIONSHIPS ===")
        
        timestamp = int(time.time())
        
        # Step 1: Create referrer for client
        client_referrer_data = {
            "email": f"client.referrer{timestamp}@test.com",
            "password": "test123",
            "full_name": "Cliente Referrer Test",
            "phone": "11999999001",
            "user_type": "cliente",
            "cpf": "12345678143"  # Valid CPF
        }
        
        response = self.make_request("POST", "/auth/register", client_referrer_data)
        if response.status_code == 200:
            data = response.json()
            self.tokens["client_referrer"] = data["access_token"]
            self.users["client_referrer"] = data["user"]
            client_referrer_code = data["user"]["referral_code"]
            self.log_test("Client Referrer Registration", True, 
                         f"Referrer criado com código: {client_referrer_code}")
        else:
            self.log_test("Client Referrer Registration", False, 
                         f"Falha: {response.status_code} - {response.text}")
            return False
        
        # Step 2: Create referrer for merchant
        merchant_referrer_data = {
            "email": f"merchant.referrer{timestamp}@test.com",
            "password": "test123",
            "full_name": "Merchant Referrer Test",
            "phone": "11999999002",
            "user_type": "cliente",
            "cpf": "12345678224"  # Valid CPF
        }
        
        response = self.make_request("POST", "/auth/register", merchant_referrer_data)
        if response.status_code == 200:
            data = response.json()
            self.tokens["merchant_referrer"] = data["access_token"]
            self.users["merchant_referrer"] = data["user"]
            merchant_referrer_code = data["user"]["referral_code"]
            self.log_test("Merchant Referrer Registration", True, 
                         f"Referrer criado com código: {merchant_referrer_code}")
        else:
            self.log_test("Merchant Referrer Registration", False, 
                         f"Falha: {response.status_code} - {response.text}")
            return False
        
        # Step 3: Create client with referral
        client_data = {
            "email": f"test.client{timestamp}@test.com",
            "password": "test123",
            "full_name": "Test Client",
            "phone": "11999999003",
            "user_type": "cliente",
            "cpf": "12345678305",  # Valid CPF
            "referral_code_used": client_referrer_code
        }
        
        response = self.make_request("POST", "/auth/register", client_data)
        if response.status_code == 200:
            data = response.json()
            self.tokens["client"] = data["access_token"]
            self.users["client"] = data["user"]
            self.log_test("Client Registration with Referral", True, 
                         f"Cliente criado com referrer: {client_referrer_code}")
        else:
            self.log_test("Client Registration with Referral", False, 
                         f"Falha: {response.status_code} - {response.text}")
            return False
        
        # Step 4: Create merchant with referral
        merchant_data = {
            "email": f"test.merchant{timestamp}@test.com",
            "password": "test123",
            "full_name": "Test Merchant",
            "phone": "11999999004",
            "user_type": "lojista",
            "company_name": "Test Store Ltda",
            "cnpj": "12345678000199",
            "address": "Rua Teste, 123",
            "whatsapp": "11999999004",
            "referral_code_used": merchant_referrer_code
        }
        
        response = self.make_request("POST", "/auth/register", merchant_data)
        if response.status_code == 200:
            data = response.json()
            self.tokens["merchant"] = data["access_token"]
            self.users["merchant"] = data["user"]
            self.log_test("Merchant Registration with Referral", True, 
                         f"Lojista criado com referrer: {merchant_referrer_code}")
        else:
            self.log_test("Merchant Registration with Referral", False, 
                         f"Falha: {response.status_code} - {response.text}")
            return False
        
        return True

    def test_cashback_scenario_with_referrals(self, purchase_amount: float, cashback_rate: float, scenario_name: str):
        """Test cashback scenario with referral relationships"""
        
        # Calculate expected values
        total_cashback = purchase_amount * (cashback_rate / 100)
        expected_buyer_cashback = total_cashback * 0.50  # 50%
        expected_buyer_referrer = total_cashback * 0.10  # 10%
        expected_store_referrer = total_cashback * 0.10  # 10%
        expected_master_commission = total_cashback * 0.30  # 30%
        
        print(f"\n📊 {scenario_name} - Valores Esperados (COM REFERRALS):")
        print(f"   💰 Valor da compra: R$ {purchase_amount:.2f}")
        print(f"   📈 Taxa de cashback: {cashback_rate}%")
        print(f"   🎁 Total de cashback: R$ {total_cashback:.2f}")
        print(f"   👤 Comprador recebe: R$ {expected_buyer_cashback:.2f} (50%)")
        print(f"   🔗 Indicador do comprador: R$ {expected_buyer_referrer:.2f} (10%)")
        print(f"   🏪 Indicador da loja: R$ {expected_store_referrer:.2f} (10%)")
        print(f"   🏛️ Master/hierárquico: R$ {expected_master_commission:.2f} (30%)")
        
        # Step 1: Set merchant cashback rate
        merchant_token = self.tokens.get("merchant")
        if not merchant_token:
            self.log_test(f"{scenario_name} - Merchant Token", False, "Token de lojista não disponível")
            return
        
        # Update cashback rate
        cashback_update = {"cashback_rate": cashback_rate}
        response = self.make_request("POST", "/merchant/cashback-rate", cashback_update, token=merchant_token)
        
        if response.status_code == 200:
            self.log_test(f"{scenario_name} - Cashback Rate Setup", True, f"Taxa configurada: {cashback_rate}%")
        else:
            self.log_test(f"{scenario_name} - Cashback Rate Setup", False, f"Falha ao configurar taxa: {response.status_code}")
        
        # Step 2: Generate QR Code with amount
        qr_request = {"amount": purchase_amount}
        response = self.make_request("POST", "/merchant/qr-code", qr_request, token=merchant_token)
        
        if response.status_code != 200:
            self.log_test(f"{scenario_name} - QR Generation", False, f"QR generation failed: {response.status_code}")
            return
            
        qr_data = response.json()
        self.log_test(f"{scenario_name} - QR Generation", True, 
                     f"QR gerado com valor R$ {qr_data['amount']:.2f}")
        
        # Step 3: Add balance to client
        client_token = self.tokens.get("client")
        if not client_token:
            self.log_test(f"{scenario_name} - Client Token", False, "Token de cliente não disponível")
            return
        
        # Add sufficient balance
        deposit_data = {
            "amount": purchase_amount + 10,  # Add extra buffer
            "method": "pix"
        }
        
        response = self.make_request("POST", "/transactions/deposit", deposit_data, token=client_token)
        if response.status_code == 200:
            self.log_test(f"{scenario_name} - Balance Setup", True, f"Depositado R$ {deposit_data['amount']:.2f}")
        else:
            self.log_test(f"{scenario_name} - Balance Setup", False, f"Falha no depósito: {response.status_code}")
            return
        
        # Step 4: Get initial balances of all parties
        initial_balances = {}
        
        for user_type in ["client", "client_referrer", "merchant_referrer"]:
            token = self.tokens.get(user_type)
            if token:
                response = self.make_request("GET", "/user/balance", token=token)
                if response.status_code == 200:
                    initial_balances[user_type] = response.json()
                else:
                    initial_balances[user_type] = {"balance": 0, "cashback_balance": 0}
        
        # Step 5: Process payment
        payment_request = {
            "amount": purchase_amount,
            "qr_code": qr_data["qr_code"]
        }
        
        response = self.make_request("POST", "/transactions/payment", payment_request, token=client_token)
        
        if response.status_code == 200:
            payment_data = response.json()
            
            # Validate payment response
            actual_cashback = payment_data.get("cashback_earned", 0)
            
            # Check if client_cashback matches expected (50% of total)
            if abs(actual_cashback - expected_buyer_cashback) < 0.01:
                self.log_test(f"{scenario_name} - Client Cashback", True, 
                             f"✅ Cliente recebeu R$ {actual_cashback:.2f} (esperado: R$ {expected_buyer_cashback:.2f})")
            else:
                self.log_test(f"{scenario_name} - Client Cashback", False, 
                             f"❌ Cliente recebeu R$ {actual_cashback:.2f}, esperado: R$ {expected_buyer_cashback:.2f}")
            
            # Check cashback distribution details
            distribution = payment_data.get("cashback_distribution", {})
            if distribution:
                client_received = distribution.get("client", 0)
                client_referrer = distribution.get("client_referrer", 0)
                merchant_referrer = distribution.get("merchant_referrer", 0)
                platform_commission = distribution.get("platform", 0)
                
                # Validate each distribution
                if abs(client_received - expected_buyer_cashback) < 0.01:
                    self.log_test(f"{scenario_name} - Distribution Client", True, 
                                 f"✅ Cliente: R$ {client_received:.2f}")
                else:
                    self.log_test(f"{scenario_name} - Distribution Client", False, 
                                 f"❌ Cliente: R$ {client_received:.2f}, esperado: R$ {expected_buyer_cashback:.2f}")
                
                if abs(client_referrer - expected_buyer_referrer) < 0.01:
                    self.log_test(f"{scenario_name} - Distribution Client Referrer", True, 
                                 f"✅ Indicador cliente: R$ {client_referrer:.2f}")
                else:
                    self.log_test(f"{scenario_name} - Distribution Client Referrer", False, 
                                 f"❌ Indicador cliente: R$ {client_referrer:.2f}, esperado: R$ {expected_buyer_referrer:.2f}")
                
                if abs(merchant_referrer - expected_store_referrer) < 0.01:
                    self.log_test(f"{scenario_name} - Distribution Merchant Referrer", True, 
                                 f"✅ Indicador loja: R$ {merchant_referrer:.2f}")
                else:
                    self.log_test(f"{scenario_name} - Distribution Merchant Referrer", False, 
                                 f"❌ Indicador loja: R$ {merchant_referrer:.2f}, esperado: R$ {expected_store_referrer:.2f}")
                
                if abs(platform_commission - expected_master_commission) < 0.01:
                    self.log_test(f"{scenario_name} - Distribution Platform", True, 
                                 f"✅ Master/hierárquico: R$ {platform_commission:.2f}")
                else:
                    self.log_test(f"{scenario_name} - Distribution Platform", False, 
                                 f"❌ Master/hierárquico: R$ {platform_commission:.2f}, esperado: R$ {expected_master_commission:.2f}")
            
            # Step 6: Verify actual balance changes
            print(f"\n🔍 {scenario_name} - Verificando mudanças reais nos saldos:")
            
            for user_type in ["client_referrer", "merchant_referrer"]:
                token = self.tokens.get(user_type)
                if token:
                    response = self.make_request("GET", "/user/balance", token=token)
                    if response.status_code == 200:
                        final_balance = response.json()
                        initial = initial_balances.get(user_type, {"cashback_balance": 0})
                        
                        cashback_increase = final_balance.get("cashback_balance", 0) - initial.get("cashback_balance", 0)
                        
                        expected_increase = expected_buyer_referrer if user_type == "client_referrer" else expected_store_referrer
                        
                        if abs(cashback_increase - expected_increase) < 0.01:
                            self.log_test(f"{scenario_name} - {user_type.title()} Balance Increase", True, 
                                         f"✅ {user_type}: +R$ {cashback_increase:.2f} cashback")
                        else:
                            self.log_test(f"{scenario_name} - {user_type.title()} Balance Increase", False, 
                                         f"❌ {user_type}: +R$ {cashback_increase:.2f}, esperado: +R$ {expected_increase:.2f}")
            
            self.log_test(f"{scenario_name} - Payment Success", True, 
                         f"✅ Pagamento R$ {purchase_amount:.2f} processado com sucesso")
            
        else:
            error_detail = response.text if response.text else "No error details"
            self.log_test(f"{scenario_name} - Payment", False, 
                         f"❌ Pagamento falhou: {response.status_code} - {error_detail}")

    def test_cashback_distribution_with_referrals(self):
        """Test cashback distribution system with proper referral relationships"""
        print("\n🎯 TESTE COMPLETO: SISTEMA DE DISTRIBUIÇÃO DE CASHBACK COM INDICAÇÕES")
        print("=" * 80)
        print("REGRAS TESTADAS:")
        print("- 50% da taxa vai para o comprador")
        print("- 10% da taxa vai para indicador do comprador")
        print("- 10% da taxa vai para indicador da loja")
        print("- 30% da taxa vai para master/hierárquico")
        print("=" * 80)
        
        # Test Scenario 1: R$ 10,00 purchase with 5% cashback
        print("\n--- CENÁRIO 1: Compra R$ 10,00 com 5% cashback (COM REFERRALS) ---")
        self.test_cashback_scenario_with_referrals(10.00, 5.0, "Cenário 1")
        
        # Test Scenario 2: R$ 20,00 purchase with 5% cashback
        print("\n--- CENÁRIO 2: Compra R$ 20,00 com 5% cashback (COM REFERRALS) ---")
        self.test_cashback_scenario_with_referrals(20.00, 5.0, "Cenário 2")
        
        # Test Scenario 3: R$ 50,00 purchase with 3% cashback
        print("\n--- CENÁRIO 3: Compra R$ 50,00 com 3% cashback (COM REFERRALS) ---")
        self.test_cashback_scenario_with_referrals(50.00, 3.0, "Cenário 3")

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🎯 RESUMO DOS TESTES DE CASHBACK COM INDICAÇÕES")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
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
        
        print("\n" + "=" * 80)

    def run_complete_cashback_tests(self):
        """Run complete cashback distribution tests with referral setup"""
        print("🎯 TESTE COMPLETO: CORREÇÃO DO SISTEMA DE CASHBACK COM INDICAÇÕES")
        print("=" * 80)
        print("OBJETIVO: Validar distribuição de cashback com relacionamentos de indicação")
        print("=" * 80)
        
        try:
            # Step 1: Create test users with referral relationships
            if not self.create_test_users_with_referrals():
                print("❌ Falha ao criar usuários de teste - abortando")
                return
            
            # Step 2: Run comprehensive cashback distribution tests
            self.test_cashback_distribution_with_referrals()
            
        except Exception as e:
            print(f"❌ ERRO CRÍTICO NOS TESTES DE CASHBACK: {e}")
            self.log_test("Critical Cashback Test Error", False, str(e))
        
        # Print summary
        self.print_test_summary()

if __name__ == "__main__":
    # Create tester instance
    tester = CashbackReferralTester()
    
    # Run complete cashback distribution tests
    tester.run_complete_cashback_tests()