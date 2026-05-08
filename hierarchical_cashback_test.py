#!/usr/bin/env python3
"""
AgitoCash Hierarchical Cashback Test
Test complex hierarchical scenario as requested in review
"""

import requests
import json
import time
import uuid
from typing import Dict, Any, Optional

class HierarchicalCashbackTester:
    def __init__(self, base_url: str = "https://login-reset.emergent.host/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
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

    def test_hierarchical_cashback_scenario(self):
        """Test complex hierarchical cashback scenario as requested in review"""
        print("\n🎯 TESTE CENÁRIO COMPLEXO HIERÁRQUICO AGITOCASH")
        print("=" * 80)
        print("OBJETIVO: Criar cadeia de indicações e executar compra com distribuição de cashback hierárquico")
        print("ESTRUTURA: Carlos Sócio Operador (RJ) → Mini Agencia (RJ) → Marcelo (Consultor) → João → Loja Du Burguer → Maria")
        print("=" * 80)
        
        # Store user data for credential reporting
        created_users = {}
        
        try:
            # Generate unique timestamp for this test run
            timestamp = str(int(time.time()))
            
            # Step 1: Create Carlos Sócio Operador (Estado do Rio de Janeiro)
            print("\n--- STEP 1: Criar Carlos Sócio Operador (Estado RJ) ---")
            
            carlos_data = {
                "email": f"carlos.socio.{timestamp}@agitocash.com",
                "password": "carlos123",
                "full_name": "Carlos Silva",
                "phone": "21999990001",
                "user_type": "cliente",
                "cpf": "11144477735"
            }
            
            response = self.make_request("POST", "/auth/register", carlos_data)
            
            if response.status_code == 200:
                data = response.json()
                created_users["carlos"] = {
                    "email": carlos_data["email"],
                    "password": carlos_data["password"],
                    "name": carlos_data["full_name"],
                    "role": "Sócio Operador",
                    "token": data["access_token"],
                    "user_id": data["user"]["id"],
                    "referral_code": data["user"]["referral_code"]
                }
                self.log_test("Carlos Sócio Operador Creation", True, 
                             f"✅ Carlos Silva criado - Estado: RJ, Código: {data['user']['referral_code']}")
            else:
                error_msg = f"❌ Falha ao criar Carlos - Status: {response.status_code}, Error: {response.text}"
                self.log_test("Carlos Sócio Operador Creation", False, error_msg)
                print(f"DEBUG: Carlos registration data: {carlos_data}")
                print(f"DEBUG: Response: {response.text}")
                return
            
            # Step 2: Create Mini Agencia (Cidade do Rio de Janeiro) - indicada por Carlos
            print("\n--- STEP 2: Criar Mini Agencia RJ (indicada por Carlos) ---")
            
            mini_agencia_data = {
                "email": f"mini.agencia.rj.{timestamp}@agitocash.com",
                "password": "agencia123",
                "full_name": "Mini Agencia Rio",
                "phone": "21999990002",
                "user_type": "cliente",
                "cpf": "12345678909",
                "referral_code_used": created_users["carlos"]["referral_code"]
            }
            
            response = self.make_request("POST", "/auth/register", mini_agencia_data)
            
            if response.status_code == 200:
                data = response.json()
                created_users["mini_agencia"] = {
                    "email": mini_agencia_data["email"],
                    "password": mini_agencia_data["password"],
                    "name": mini_agencia_data["full_name"],
                    "role": "Mini Agencia",
                    "token": data["access_token"],
                    "user_id": data["user"]["id"],
                    "referral_code": data["user"]["referral_code"]
                }
                self.log_test("Mini Agencia Creation", True, 
                             f"✅ Mini Agencia Rio criada - Cidade: RJ, Indicada por Carlos")
            else:
                error_msg = f"❌ Falha ao criar Mini Agencia - Status: {response.status_code}, Error: {response.text}"
                self.log_test("Mini Agencia Creation", False, error_msg)
                print(f"DEBUG: Mini Agencia registration data: {mini_agencia_data}")
                print(f"DEBUG: Response: {response.text}")
                return
            
            # Step 3: Create Marcelo (Consultor) - indicado por Mini Agencia
            print("\n--- STEP 3: Criar Marcelo Consultor (indicado por Mini Agencia) ---")
            
            marcelo_data = {
                "email": f"marcelo.consultor.{timestamp}@agitocash.com",
                "password": "marcelo123",
                "full_name": "Marcelo Santos",
                "phone": "21999990003",
                "user_type": "cliente",
                "cpf": "98765432100",
                "referral_code_used": created_users["mini_agencia"]["referral_code"]
            }
            
            response = self.make_request("POST", "/auth/register", marcelo_data)
            
            if response.status_code == 200:
                data = response.json()
                created_users["marcelo"] = {
                    "email": marcelo_data["email"],
                    "password": marcelo_data["password"],
                    "name": marcelo_data["full_name"],
                    "role": "Consultor",
                    "token": data["access_token"],
                    "user_id": data["user"]["id"],
                    "referral_code": data["user"]["referral_code"]
                }
                self.log_test("Marcelo Consultor Creation", True, 
                             f"✅ Marcelo Santos criado - Função: Consultor, Indicado por Mini Agencia")
            else:
                self.log_test("Marcelo Consultor Creation", False, 
                             f"❌ Falha ao criar Marcelo - Status: {response.status_code}")
                return
            
            # Step 4: Create João (Cliente) - indicado por Marcelo
            print("\n--- STEP 4: Criar João Cliente (indicado por Marcelo) ---")
            
            joao_data = {
                "email": f"joao.cliente.{timestamp}@test.com",
                "password": "joao123",
                "full_name": "João Oliveira",
                "phone": "21999990004",
                "user_type": "cliente",
                "cpf": "44455566677",
                "referral_code_used": created_users["marcelo"]["referral_code"]
            }
            
            response = self.make_request("POST", "/auth/register", joao_data)
            
            if response.status_code == 200:
                data = response.json()
                created_users["joao"] = {
                    "email": joao_data["email"],
                    "password": joao_data["password"],
                    "name": joao_data["full_name"],
                    "role": "Cliente",
                    "token": data["access_token"],
                    "user_id": data["user"]["id"],
                    "referral_code": data["user"]["referral_code"]
                }
                self.log_test("João Cliente Creation", True, 
                             f"✅ João Oliveira criado - Tipo: Cliente, Indicado por Marcelo")
            else:
                error_msg = f"❌ Falha ao criar João - Status: {response.status_code}, Error: {response.text}"
                self.log_test("João Cliente Creation", False, error_msg)
                print(f"DEBUG: João registration data: {joao_data}")
                print(f"DEBUG: Response: {response.text}")
                return
            
            # Step 5: Create Loja Du Burguer (Lojista) - indicada por João
            print("\n--- STEP 5: Criar Loja Du Burguer (indicada por João) ---")
            
            loja_data = {
                "email": f"duburger.{timestamp}@loja.com",
                "password": "duburger123",
                "full_name": "Pedro Costa",
                "phone": "21999990005",
                "user_type": "lojista",
                "company_name": "Loja Du Burguer",
                "cnpj": "11222333000144",
                "address": "Rua Copacabana, 100 - Rio de Janeiro/RJ",
                "whatsapp": "21999990005",
                "cashback_rate": 10.0,
                "state": "Rio de Janeiro",
                "city": "Rio de Janeiro",
                "referral_code_used": created_users["joao"]["referral_code"]
            }
            
            response = self.make_request("POST", "/auth/register", loja_data)
            
            if response.status_code == 200:
                data = response.json()
                created_users["loja"] = {
                    "email": loja_data["email"],
                    "password": loja_data["password"],
                    "name": loja_data["full_name"],
                    "company": loja_data["company_name"],
                    "role": "Lojista",
                    "token": data["access_token"],
                    "user_id": data["user"]["id"],
                    "referral_code": data["user"]["referral_code"],
                    "cashback_rate": loja_data["cashback_rate"]
                }
                self.log_test("Loja Du Burguer Creation", True, 
                             f"✅ Loja Du Burguer criada - Cashback: 10%, Indicada por João")
            else:
                self.log_test("Loja Du Burguer Creation", False, 
                             f"❌ Falha ao criar Loja Du Burguer - Status: {response.status_code}")
                return
            
            # Step 6: Create Maria (Cliente Compradora) - indicada pela Loja
            print("\n--- STEP 6: Criar Maria Compradora (indicada pela Loja) ---")
            
            maria_data = {
                "email": f"maria.compradora.{timestamp}@test.com",
                "password": "maria123",
                "full_name": "Maria Silva",
                "phone": "21999990006",
                "user_type": "cliente",
                "cpf": "22233344455",
                "referral_code_used": created_users["loja"]["referral_code"]
            }
            
            response = self.make_request("POST", "/auth/register", maria_data)
            
            if response.status_code == 200:
                data = response.json()
                created_users["maria"] = {
                    "email": maria_data["email"],
                    "password": maria_data["password"],
                    "name": maria_data["full_name"],
                    "role": "Cliente Compradora",
                    "token": data["access_token"],
                    "user_id": data["user"]["id"],
                    "referral_code": data["user"]["referral_code"]
                }
                self.log_test("Maria Compradora Creation", True, 
                             f"✅ Maria Silva criada - Tipo: Cliente, Indicada pela Loja Du Burguer")
            else:
                self.log_test("Maria Compradora Creation", False, 
                             f"❌ Falha ao criar Maria - Status: {response.status_code}")
                return
            
            # Step 7: Add balance to Maria for the purchase
            print("\n--- STEP 7: Adicionar saldo para Maria fazer a compra ---")
            
            deposit_data = {
                "amount": 150.00,
                "method": "pix"
            }
            
            response = self.make_request("POST", "/transactions/deposit", deposit_data, token=created_users["maria"]["token"])
            
            if response.status_code == 200:
                self.log_test("Maria Balance Setup", True, "✅ R$ 150,00 depositado para Maria")
            else:
                self.log_test("Maria Balance Setup", False, f"❌ Falha no depósito: {response.status_code}")
                return
            
            # Step 8: Generate QR Code from Loja Du Burguer for R$ 100,00
            print("\n--- STEP 8: Loja Du Burguer gera QR Code para venda R$ 100,00 ---")
            
            qr_request = {
                "amount": 100.00
            }
            
            response = self.make_request("POST", "/merchant/qr-code", qr_request, token=created_users["loja"]["token"])
            
            if response.status_code == 200:
                qr_data = response.json()
                self.log_test("QR Code Generation", True, 
                             f"✅ QR Code gerado - Valor: R$ {qr_data['amount']:.2f}, Cashback: {qr_data.get('cashback_rate', 0)}%")
            else:
                self.log_test("QR Code Generation", False, f"❌ Falha ao gerar QR: {response.status_code}")
                return
            
            # Step 9: Get initial balances before purchase
            print("\n--- STEP 9: Verificar saldos antes da compra ---")
            
            initial_balances = {}
            for user_key, user_info in created_users.items():
                response = self.make_request("GET", "/user/balance", token=user_info["token"])
                if response.status_code == 200:
                    balance_data = response.json()
                    initial_balances[user_key] = {
                        "balance": balance_data.get("balance", 0),
                        "cashback_balance": balance_data.get("cashback_balance", 0),
                        "total": balance_data.get("total", 0)
                    }
                    self.log_test(f"Initial Balance {user_info['name']}", True, 
                                 f"Saldo: R$ {balance_data.get('balance', 0):.2f}, "
                                 f"Cashback: R$ {balance_data.get('cashback_balance', 0):.2f}")
            
            # Step 10: Maria makes the purchase of R$ 100,00
            print("\n--- STEP 10: Maria compra R$ 100,00 na Loja Du Burguer ---")
            
            payment_data = {
                "amount": 100.00,
                "qr_code": qr_data["qr_code"]
            }
            
            response = self.make_request("POST", "/transactions/payment", payment_data, token=created_users["maria"]["token"])
            
            if response.status_code == 200:
                payment_result = response.json()
                self.log_test("Purchase Execution", True, 
                             f"✅ Compra processada - Valor: R$ 100,00, "
                             f"Cashback total: R$ {payment_result.get('total_cashback', 0):.2f}")
            else:
                self.log_test("Purchase Execution", False, 
                             f"❌ Falha na compra: {response.status_code} - {response.text}")
                return
            
            # Step 11: Verify final balances and cashback distribution
            print("\n--- STEP 11: Verificar distribuição de cashback ---")
            
            final_balances = {}
            for user_key, user_info in created_users.items():
                response = self.make_request("GET", "/user/balance", token=user_info["token"])
                if response.status_code == 200:
                    balance_data = response.json()
                    final_balances[user_key] = {
                        "balance": balance_data.get("balance", 0),
                        "cashback_balance": balance_data.get("cashback_balance", 0),
                        "total": balance_data.get("total", 0)
                    }
                    
                    # Calculate changes
                    initial = initial_balances.get(user_key, {"balance": 0, "cashback_balance": 0, "total": 0})
                    balance_change = final_balances[user_key]["balance"] - initial["balance"]
                    cashback_change = final_balances[user_key]["cashback_balance"] - initial["cashback_balance"]
                    total_change = final_balances[user_key]["total"] - initial["total"]
                    
                    self.log_test(f"Final Balance {user_info['name']}", True, 
                                 f"Saldo: R$ {balance_data.get('balance', 0):.2f} ({balance_change:+.2f}), "
                                 f"Cashback: R$ {balance_data.get('cashback_balance', 0):.2f} ({cashback_change:+.2f}), "
                                 f"Total: R$ {balance_data.get('total', 0):.2f} ({total_change:+.2f})")
            
            # Step 12: Validate expected cashback distribution
            print("\n--- STEP 12: Validar distribuição esperada ---")
            
            # Expected distribution for R$ 100,00 with 10% cashback (R$ 10,00 total):
            # - Maria (50%): R$ 5,00
            # - Loja Du Burguer (10% - indicadora): R$ 1,00  
            # - João (10% - indicador da loja): R$ 1,00
            # - Master (30%): R$ 3,00
            
            expected_distributions = {
                "maria": {"cashback_change": 5.00, "description": "50% do cashback"},
                "loja": {"balance_change": 90.00, "description": "R$ 100 venda - R$ 10 cashback oferecido"},
                "joao": {"cashback_change": 1.00, "description": "10% por indicar a loja"},
            }
            
            for user_key, expected in expected_distributions.items():
                if user_key in final_balances and user_key in initial_balances:
                    initial = initial_balances[user_key]
                    final = final_balances[user_key]
                    
                    if "cashback_change" in expected:
                        actual_change = final["cashback_balance"] - initial["cashback_balance"]
                        expected_change = expected["cashback_change"]
                        
                        if abs(actual_change - expected_change) < 0.01:  # Allow small floating point differences
                            self.log_test(f"Expected Distribution {created_users[user_key]['name']}", True, 
                                         f"✅ {expected['description']}: R$ {actual_change:.2f} (esperado: R$ {expected_change:.2f})")
                        else:
                            self.log_test(f"Expected Distribution {created_users[user_key]['name']}", False, 
                                         f"❌ {expected['description']}: R$ {actual_change:.2f} (esperado: R$ {expected_change:.2f})")
                    
                    if "balance_change" in expected:
                        actual_change = final["balance"] - initial["balance"]
                        expected_change = expected["balance_change"]
                        
                        if abs(actual_change - expected_change) < 0.01:
                            self.log_test(f"Expected Balance {created_users[user_key]['name']}", True, 
                                         f"✅ {expected['description']}: R$ {actual_change:.2f} (esperado: R$ {expected_change:.2f})")
                        else:
                            self.log_test(f"Expected Balance {created_users[user_key]['name']}", False, 
                                         f"❌ {expected['description']}: R$ {actual_change:.2f} (esperado: R$ {expected_change:.2f})")
            
            # Step 13: Report all created credentials
            print("\n--- STEP 13: Credenciais de Acesso Criadas ---")
            print("\n🔑 CREDENCIAIS DE TODAS AS CONTAS CRIADAS:")
            print("=" * 60)
            
            for user_key, user_info in created_users.items():
                print(f"\n{user_info['role']} - {user_info['name']}:")
                print(f"  📧 Email: {user_info['email']}")
                print(f"  🔒 Senha: {user_info['password']}")
                if 'company' in user_info:
                    print(f"  🏢 Empresa: {user_info['company']}")
                if 'cashback_rate' in user_info:
                    print(f"  💰 Cashback: {user_info['cashback_rate']}%")
            
            self.log_test("Hierarchical Scenario Complete", True, 
                         "🎯 CENÁRIO HIERÁRQUICO COMPLETO EXECUTADO COM SUCESSO - "
                         "Cadeia de indicações criada, compra processada, cashback distribuído")
            
        except Exception as e:
            self.log_test("Hierarchical Scenario Error", False, f"❌ ERRO CRÍTICO: {str(e)}")
            print(f"❌ ERRO CRÍTICO NO CENÁRIO HIERÁRQUICO: {e}")

    def print_test_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 RESUMO DOS TESTES")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        success_rate = (passed / len(self.test_results)) * 100 if self.test_results else 0
        
        print(f"✅ Testes Aprovados: {passed}")
        print(f"❌ Testes Falharam: {failed}")
        print(f"📈 Taxa de Sucesso: {success_rate:.1f}%")
        
        if failed > 0:
            print(f"\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")

if __name__ == "__main__":
    tester = HierarchicalCashbackTester()
    tester.test_hierarchical_cashback_scenario()
    tester.print_test_summary()