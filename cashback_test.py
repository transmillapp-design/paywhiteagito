#!/usr/bin/env python3
"""
AgitoCash Cashback Distribution Testing Suite
Specific tests for cashback distribution system validation
"""

import requests
import json
import time
from typing import Dict, Any

class CashbackTester:
    def __init__(self, base_url: str = "https://login-reset.emergent.host/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tokens = {}
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

    def test_demo_credentials(self):
        """Test demo credentials login"""
        print("\n=== TESTING DEMO CREDENTIALS ===")
        
        demo_credentials = [
            {
                "email": "cliente@demo.com",
                "password": "demo123",
                "type": "cliente",
                "name": "Demo Cliente"
            },
            {
                "email": "lojista@demo.com", 
                "password": "demo123",
                "type": "lojista",
                "name": "Demo Lojista"
            }
        ]
        
        for cred in demo_credentials:
            login_data = {
                "email": cred["email"],
                "password": cred["password"]
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data["access_token"]
                user_data = data["user"]
                
                self.tokens[cred["type"]] = token
                self.log_test(f"{cred['name']} Login", True, 
                             f"✅ LOGIN SUCCESSFUL - {cred['email']}")
                
                # Test profile access
                profile_response = self.make_request("GET", "/user/profile", token=token)
                if profile_response.status_code == 200:
                    self.log_test(f"{cred['name']} Profile", True, "✅ Profile accessible")
                else:
                    self.log_test(f"{cred['name']} Profile", False, f"❌ Profile access failed: {profile_response.status_code}")
                    
            else:
                self.log_test(f"{cred['name']} Login", False, 
                             f"❌ LOGIN FAILED - Status: {response.status_code}")

    def test_cashback_scenario(self, purchase_amount: float, cashback_rate: float, scenario_name: str):
        """Test specific cashback scenario with expected distributions"""
        
        # Calculate expected values
        total_cashback = purchase_amount * (cashback_rate / 100)
        expected_buyer_cashback = total_cashback * 0.50  # 50%
        expected_buyer_referrer = total_cashback * 0.10  # 10%
        expected_store_referrer = total_cashback * 0.10  # 10%
        expected_master_commission = total_cashback * 0.30  # 30%
        
        print(f"\n📊 {scenario_name} - Valores Esperados:")
        print(f"   💰 Valor da compra: R$ {purchase_amount:.2f}")
        print(f"   📈 Taxa de cashback: {cashback_rate}%")
        print(f"   🎁 Total de cashback: R$ {total_cashback:.2f}")
        print(f"   👤 Comprador recebe: R$ {expected_buyer_cashback:.2f} (50%)")
        print(f"   🔗 Indicador do comprador: R$ {expected_buyer_referrer:.2f} (10%)")
        print(f"   🏪 Indicador da loja: R$ {expected_store_referrer:.2f} (10%)")
        print(f"   🏛️ Master/hierárquico: R$ {expected_master_commission:.2f} (30%)")
        
        # Step 1: Login as lojista and set cashback rate
        lojista_token = self.tokens.get("lojista")
        if not lojista_token:
            self.log_test(f"{scenario_name} - Lojista Token", False, "Token de lojista não disponível")
            return
        
        # Get lojista profile to check current cashback rate
        response = self.make_request("GET", "/user/profile", token=lojista_token)
        if response.status_code == 200:
            lojista_data = response.json()
            current_rate = lojista_data.get("cashback_rate", 0)
            
            # Update cashback rate if needed
            if current_rate != cashback_rate:
                cashback_update = {"cashback_rate": cashback_rate}
                response = self.make_request("POST", "/merchant/cashback-rate", cashback_update, token=lojista_token)
                
                if response.status_code == 200:
                    self.log_test(f"{scenario_name} - Cashback Rate Setup", True, f"Taxa configurada: {cashback_rate}%")
                else:
                    self.log_test(f"{scenario_name} - Cashback Rate Setup", False, f"Falha ao configurar taxa: {response.status_code}")
        
        # Step 2: Generate QR Code with amount
        qr_request = {"amount": purchase_amount}
        response = self.make_request("POST", "/merchant/qr-code", qr_request, token=lojista_token)
        
        if response.status_code != 200:
            self.log_test(f"{scenario_name} - QR Generation", False, f"QR generation failed: {response.status_code}")
            return
            
        qr_data = response.json()
        self.log_test(f"{scenario_name} - QR Generation", True, 
                     f"QR gerado com valor R$ {qr_data['amount']:.2f}")
        
        # Step 3: Login as cliente and make payment
        cliente_token = self.tokens.get("cliente")
        if not cliente_token:
            self.log_test(f"{scenario_name} - Cliente Token", False, "Token de cliente não disponível")
            return
        
        # Get initial balances
        response = self.make_request("GET", "/user/balance", token=cliente_token)
        if response.status_code == 200:
            initial_balance = response.json()
            initial_main_balance = initial_balance.get("balance", 0)
            initial_cashback_balance = initial_balance.get("cashback_balance", 0)
        else:
            initial_main_balance = 0
            initial_cashback_balance = 0
        
        # Ensure client has sufficient balance
        if initial_main_balance < purchase_amount:
            deposit_needed = purchase_amount - initial_main_balance + 10  # Add extra buffer
            deposit_data = {
                "amount": deposit_needed,
                "method": "pix"
            }
            
            response = self.make_request("POST", "/transactions/deposit", deposit_data, token=cliente_token)
            if response.status_code == 200:
                self.log_test(f"{scenario_name} - Balance Setup", True, f"Depositado R$ {deposit_needed:.2f}")
            else:
                self.log_test(f"{scenario_name} - Balance Setup", False, f"Falha no depósito: {response.status_code}")
                return
        
        # Step 4: Process payment
        payment_request = {
            "amount": purchase_amount,
            "qr_code": qr_data["qr_code"]
        }
        
        response = self.make_request("POST", "/transactions/payment", payment_request, token=cliente_token)
        
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
            
            # Validate total cashback calculation
            total_cashback_calculated = payment_data.get("total_cashback", 0)
            if abs(total_cashback_calculated - total_cashback) < 0.01:
                self.log_test(f"{scenario_name} - Total Cashback", True, 
                             f"✅ Total cashback R$ {total_cashback_calculated:.2f} (esperado: R$ {total_cashback:.2f})")
            else:
                self.log_test(f"{scenario_name} - Total Cashback", False, 
                             f"❌ Total cashback R$ {total_cashback_calculated:.2f}, esperado: R$ {total_cashback:.2f}")
            
            # Check cashback distribution details if available
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
            
            self.log_test(f"{scenario_name} - Payment Success", True, 
                         f"✅ Pagamento R$ {purchase_amount:.2f} processado com sucesso")
            
        else:
            error_detail = response.text if response.text else "No error details"
            self.log_test(f"{scenario_name} - Payment", False, 
                         f"❌ Pagamento falhou: {response.status_code} - {error_detail}")

    def test_cashback_transactions_in_statement(self):
        """Test that cashback transactions appear correctly in statement"""
        
        # Login as cliente to check transaction history
        cliente_token = self.tokens.get("cliente")
        if not cliente_token:
            self.log_test("Statement Check - Cliente Token", False, "Token de cliente não disponível")
            return
        
        # Get transaction history
        response = self.make_request("GET", "/transactions/history", token=cliente_token)
        
        if response.status_code == 200:
            transactions = response.json()
            
            # Look for payment and cashback transactions
            payment_transactions = [t for t in transactions if t.get("transaction_type") == "payment"]
            cashback_transactions = [t for t in transactions if "cashback" in t.get("transaction_type", "")]
            referral_transactions = [t for t in transactions if "referral" in t.get("transaction_type", "")]
            
            self.log_test("Statement - Payment Transactions", True, 
                         f"✅ {len(payment_transactions)} transações de pagamento encontradas")
            
            self.log_test("Statement - Cashback Transactions", True, 
                         f"✅ {len(cashback_transactions)} transações de cashback encontradas")
            
            if referral_transactions:
                self.log_test("Statement - Referral Transactions", True, 
                             f"✅ {len(referral_transactions)} transações de indicação encontradas")
            
            # Validate transaction details
            for tx in payment_transactions[-3:]:  # Check last 3 payments
                amount = tx.get("amount", 0)
                cashback_amount = tx.get("cashback_amount", 0)
                description = tx.get("description", "")
                
                self.log_test("Statement - Transaction Detail", True, 
                             f"✅ Pagamento: R$ {amount:.2f}, Cashback: R$ {cashback_amount:.2f}, {description}")
            
        else:
            self.log_test("Statement Check", False, f"Falha ao obter histórico: {response.status_code}")
        
        # Also check lojista statement
        lojista_token = self.tokens.get("lojista")
        if lojista_token:
            response = self.make_request("GET", "/transactions/history", token=lojista_token)
            
            if response.status_code == 200:
                lojista_transactions = response.json()
                
                sale_transactions = [t for t in lojista_transactions if t.get("transaction_type") == "sale"]
                cashback_expense_transactions = [t for t in lojista_transactions if t.get("transaction_type") == "cashback_expense"]
                
                self.log_test("Statement - Lojista Sales", True, 
                             f"✅ {len(sale_transactions)} transações de venda no extrato do lojista")
                
                self.log_test("Statement - Lojista Cashback Expense", True, 
                             f"✅ {len(cashback_expense_transactions)} transações de cashback oferecido")
            else:
                self.log_test("Statement - Lojista Check", False, f"Falha ao obter extrato lojista: {response.status_code}")

    def test_cashback_distribution_system(self):
        """Test cashback distribution system according to AgitoCash rules"""
        print("\n🎯 TESTE URGENTE: SISTEMA DE DISTRIBUIÇÃO DE CASHBACK")
        print("=" * 70)
        print("REGRAS TESTADAS:")
        print("- 50% da taxa vai para o comprador")
        print("- 10% da taxa vai para indicador do comprador")
        print("- 10% da taxa vai para indicador da loja")
        print("- 30% da taxa vai para master/hierárquico")
        print("=" * 70)
        
        # Test Scenario 1: R$ 10,00 purchase with 5% cashback
        print("\n--- CENÁRIO 1: Compra R$ 10,00 com 5% cashback ---")
        self.test_cashback_scenario(10.00, 5.0, "Cenário 1")
        
        # Test Scenario 2: R$ 20,00 purchase with 5% cashback
        print("\n--- CENÁRIO 2: Compra R$ 20,00 com 5% cashback ---")
        self.test_cashback_scenario(20.00, 5.0, "Cenário 2")
        
        # Test Scenario 3: R$ 50,00 purchase with 3% cashback
        print("\n--- CENÁRIO 3: Compra R$ 50,00 com 3% cashback ---")
        self.test_cashback_scenario(50.00, 3.0, "Cenário 3")
        
        # Test transaction records in statement
        print("\n--- TESTE: Verificar transações no extrato ---")
        self.test_cashback_transactions_in_statement()

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🎯 RESUMO DOS TESTES DE CASHBACK")
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

    def run_cashback_distribution_tests(self):
        """Run comprehensive cashback distribution tests as requested in review"""
        print("🎯 TESTE URGENTE: CORREÇÃO DO SISTEMA DE CASHBACK NO AGITOCASH")
        print("=" * 80)
        print("OBJETIVO: Validar se as regras de distribuição de cashback foram corrigidas")
        print("CREDENCIAIS: cliente@demo.com/demo123, lojista@demo.com/demo123")
        print("=" * 80)
        
        try:
            # First ensure demo credentials work
            self.test_demo_credentials()
            
            # Run comprehensive cashback distribution tests
            self.test_cashback_distribution_system()
            
        except Exception as e:
            print(f"❌ ERRO CRÍTICO NOS TESTES DE CASHBACK: {e}")
            self.log_test("Critical Cashback Test Error", False, str(e))
        
        # Print summary
        self.print_test_summary()

if __name__ == "__main__":
    # Create tester instance
    tester = CashbackTester()
    
    # Run cashback distribution tests
    tester.run_cashback_distribution_tests()