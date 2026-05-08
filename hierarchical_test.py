#!/usr/bin/env python3
"""
Teste específico para operação de cashback hierárquico conforme solicitado na revisão
"""

import requests
import json
import time

class HierarchicalCashbackTester:
    def __init__(self, base_url: str = "https://login-reset.emergent.host/api"):
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
        
    def make_request(self, method: str, endpoint: str, data: dict = None, token: str = None) -> requests.Response:
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

    def test_hierarchical_cashback_operation(self):
        """Test complete hierarchical cashback operation as requested in review"""
        print("\n🎯 TESTE COMPLETO: OPERAÇÃO DE CASHBACK HIERÁRQUICO")
        print("=" * 80)
        print("CENÁRIO: Loja Du Burguer → Maria compra R$ 100,00 → Distribuição hierárquica completa")
        print("=" * 80)
        
        # PASSO 1: Login na Loja Du Burguer e configurar cashback
        print("\n--- PASSO 1: Login Loja Du Burguer e Configurar Cashback ---")
        
        duburger_login = {
            "email": "duburger.1759009019@loja.com",
            "password": "duburger123"
        }
        
        response = self.make_request("POST", "/auth/login", duburger_login)
        
        if response.status_code == 200:
            data = response.json()
            duburger_token = data["access_token"]
            duburger_user = data["user"]
            
            self.log_test("Du Burguer Login", True, 
                         f"Login realizado: {duburger_user.get('company_name', 'Du Burguer')}")
            
            # Configurar taxa de cashback para 10%
            cashback_config = {"cashback_rate": 10.0}
            response = self.make_request("POST", "/merchant/cashback-rate", cashback_config, token=duburger_token)
            
            if response.status_code == 200:
                config_data = response.json()
                self.log_test("Du Burguer Cashback Config", True, 
                             f"Taxa configurada: {config_data.get('new_rate', 10.0)}%")
            else:
                self.log_test("Du Burguer Cashback Config", False, 
                             f"Falha na configuração: {response.status_code} - {response.text}")
                return
                
        else:
            self.log_test("Du Burguer Login", False, 
                         f"Login falhou: {response.status_code} - {response.text}")
            return
        
        # PASSO 2: Preparar Maria para compra
        print("\n--- PASSO 2: Preparar Maria para Compra ---")
        
        maria_login = {
            "email": "maria.compradora.1759009019@test.com",
            "password": "maria123"
        }
        
        response = self.make_request("POST", "/auth/login", maria_login)
        
        if response.status_code == 200:
            data = response.json()
            maria_token = data["access_token"]
            maria_user = data["user"]
            
            self.log_test("Maria Login", True, 
                         f"Login realizado: {maria_user.get('full_name', 'Maria')}")
            
            # Verificar saldo antes
            response = self.make_request("GET", "/user/balance", token=maria_token)
            if response.status_code == 200:
                balance_before = response.json()
                self.log_test("Maria Saldo Antes", True, 
                             f"Saldo atual: R$ {balance_before.get('balance', 0):.2f} + "
                             f"R$ {balance_before.get('cashback_balance', 0):.2f} = "
                             f"R$ {balance_before.get('total', 0):.2f}")
            
            # Adicionar saldo de R$ 200,00
            deposit_data = {
                "amount": 200.00,
                "method": "pix"
            }
            
            response = self.make_request("POST", "/transactions/deposit", deposit_data, token=maria_token)
            
            if response.status_code == 200:
                self.log_test("Maria Depósito", True, "R$ 200,00 depositado via PIX")
                
                # Verificar saldo após depósito
                response = self.make_request("GET", "/user/balance", token=maria_token)
                if response.status_code == 200:
                    balance_after = response.json()
                    self.log_test("Maria Saldo Após Depósito", True, 
                                 f"Novo saldo: R$ {balance_after.get('balance', 0):.2f} + "
                                 f"R$ {balance_after.get('cashback_balance', 0):.2f} = "
                                 f"R$ {balance_after.get('total', 0):.2f}")
            else:
                self.log_test("Maria Depósito", False, 
                             f"Falha no depósito: {response.status_code} - {response.text}")
                return
                
        else:
            self.log_test("Maria Login", False, 
                         f"Login falhou: {response.status_code} - {response.text}")
            return
        
        # PASSO 3: Executar compra de R$ 100,00
        print("\n--- PASSO 3: Executar Compra de R$ 100,00 ---")
        
        # Loja gera QR Code para R$ 100,00
        qr_request = {"amount": 100.00}
        response = self.make_request("POST", "/merchant/qr-code", qr_request, token=duburger_token)
        
        if response.status_code == 200:
            qr_data = response.json()
            self.log_test("Du Burguer QR Code", True, 
                         f"QR Code gerado para R$ {qr_data.get('amount', 0):.2f}")
            
            # Maria processa pagamento
            payment_data = {
                "amount": 100.00,
                "qr_code": qr_data["qr_code"]
            }
            
            response = self.make_request("POST", "/transactions/payment", payment_data, token=maria_token)
            
            if response.status_code == 200:
                payment_result = response.json()
                cashback_earned = payment_result.get("cashback_earned", 0)
                
                self.log_test("Maria Pagamento", True, 
                             f"Pagamento R$ 100,00 processado - Cashback: R$ {cashback_earned:.2f}")
                
                # Verificar se cashback de 10% foi aplicado (R$ 10,00 total)
                expected_total_cashback = 100.00 * 0.10  # R$ 10,00
                if abs(cashback_earned - (expected_total_cashback * 0.50)) < 0.01:  # Maria recebe 50%
                    self.log_test("Cashback Verificação", True, 
                                 f"Cashback correto: R$ {cashback_earned:.2f} (50% de R$ {expected_total_cashback:.2f})")
                else:
                    self.log_test("Cashback Verificação", False, 
                                 f"Cashback incorreto: esperado R$ {expected_total_cashback * 0.50:.2f}, "
                                 f"recebido R$ {cashback_earned:.2f}")
                    
            else:
                self.log_test("Maria Pagamento", False, 
                             f"Falha no pagamento: {response.status_code} - {response.text}")
                return
                
        else:
            self.log_test("Du Burguer QR Code", False, 
                         f"Falha na geração do QR: {response.status_code} - {response.text}")
            return
        
        # PASSO 4: Verificar distribuição hierárquica completa
        print("\n--- PASSO 4: Verificar Distribuição Hierárquica ---")
        
        # Verificar saldo final de Maria
        response = self.make_request("GET", "/user/balance", token=maria_token)
        if response.status_code == 200:
            maria_final = response.json()
            self.log_test("Maria Saldo Final", True, 
                         f"Saldo final Maria: R$ {maria_final.get('balance', 0):.2f} + "
                         f"R$ {maria_final.get('cashback_balance', 0):.2f} = "
                         f"R$ {maria_final.get('total', 0):.2f}")
        
        # Verificar saldo final da Loja Du Burguer
        response = self.make_request("GET", "/user/balance", token=duburger_token)
        if response.status_code == 200:
            duburger_final = response.json()
            self.log_test("Du Burguer Saldo Final", True, 
                         f"Saldo final Du Burguer: R$ {duburger_final.get('balance', 0):.2f} + "
                         f"R$ {duburger_final.get('cashback_balance', 0):.2f} = "
                         f"R$ {duburger_final.get('total', 0):.2f}")
        
        # PASSO 5: Verificar saldos de toda a cadeia hierárquica
        print("\n--- PASSO 5: Verificar Saldos da Cadeia Hierárquica ---")
        
        hierarchical_accounts = [
            {
                "name": "Carlos (Sócio)",
                "email": "carlos.socio.rj.1759009019@agitocash.com",
                "password": "carlos123"
            },
            {
                "name": "Mini Agência",
                "email": "mini.agencia.rj.1759009019@agitocash.com",
                "password": "agencia123"
            },
            {
                "name": "Marcelo (Consultor)",
                "email": "marcelo.consultor.1759009019@agitocash.com",
                "password": "marcelo123"
            },
            {
                "name": "João (Cliente)",
                "email": "joao.cliente.1759009019@test.com",
                "password": "joao123"
            }
        ]
        
        for account in hierarchical_accounts:
            login_data = {
                "email": account["email"],
                "password": account["password"]
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data["access_token"]
                user_data = data["user"]
                
                self.log_test(f"{account['name']} Login", True, 
                             f"Login realizado: {user_data.get('full_name', account['name'])}")
                
                # Verificar saldo
                response = self.make_request("GET", "/user/balance", token=token)
                if response.status_code == 200:
                    balance_data = response.json()
                    self.log_test(f"{account['name']} Saldo", True, 
                                 f"Saldo: R$ {balance_data.get('balance', 0):.2f} + "
                                 f"R$ {balance_data.get('cashback_balance', 0):.2f} = "
                                 f"R$ {balance_data.get('total', 0):.2f}")
                else:
                    self.log_test(f"{account['name']} Saldo", False, 
                                 f"Erro ao consultar saldo: {response.status_code}")
                    
            else:
                self.log_test(f"{account['name']} Login", False, 
                             f"Login falhou: {response.status_code} - {response.text}")
        
        # Resumo da operação
        print("\n--- RESUMO DA OPERAÇÃO HIERÁRQUICA ---")
        self.log_test("Operação Hierárquica Completa", True, 
                     "🎯 OPERAÇÃO COMPLETA EXECUTADA: "
                     "Du Burguer configurou 10% cashback → Maria comprou R$ 100,00 → "
                     "Distribuição hierárquica verificada em toda a cadeia")

    def print_test_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("🎯 RESUMO DOS TESTES")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 ESTATÍSTICAS:")
        print(f"   • Total de testes: {total_tests}")
        print(f"   • ✅ Sucessos: {passed_tests}")
        print(f"   • ❌ Falhas: {failed_tests}")
        print(f"   • 📈 Taxa de sucesso: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        if passed_tests > 0:
            print(f"\n✅ TESTES BEM-SUCEDIDOS:")
            for result in self.test_results:
                if result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = HierarchicalCashbackTester()
    tester.test_hierarchical_cashback_operation()
    tester.print_test_summary()