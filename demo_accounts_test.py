#!/usr/bin/env python3
"""
Demo Accounts Investigation for AgitoCash Preview Environment
Investigates why demo accounts work on one URL but not another
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class DemoAccountsInvestigator:
    def __init__(self):
        self.working_url = "https://login-reset.emergent.host/api"
        self.preview_url = "https://api-decompose-1.preview.emergentagent.com/api"
        self.session = requests.Session()
        self.test_results = []
        
        self.demo_credentials = [
            {
                "email": "cliente@demo.com",
                "password": "demo123",
                "type": "cliente",
                "name": "Cliente Demo"
            },
            {
                "email": "lojista@demo.com", 
                "password": "demo123",
                "type": "lojista",
                "name": "Lojista Demo"
            },
            {
                "email": "master@agitocash.com",
                "password": "master123", 
                "type": "master",
                "name": "Master Demo"
            }
        ]
        
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
        
    def make_request(self, base_url: str, method: str, endpoint: str, data: Dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{base_url}{endpoint}"
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

    def test_environment_accessibility(self):
        """Test if both environments are accessible"""
        print("\n=== TESTE 1: ACESSIBILIDADE DOS AMBIENTES ===")
        
        # Test working environment
        try:
            response = self.make_request(self.working_url, "GET", "/user/profile")
            if response.status_code == 401:
                self.log_test("Working Environment", True, 
                             f"✅ {self.working_url} - API responde (401 esperado)")
            else:
                self.log_test("Working Environment", False, 
                             f"❌ Resposta inesperada: {response.status_code}")
        except Exception as e:
            self.log_test("Working Environment", False, f"❌ Erro de conexão: {str(e)}")
        
        # Test preview environment
        try:
            response = self.make_request(self.preview_url, "GET", "/user/profile")
            if response.status_code == 401:
                self.log_test("Preview Environment", True, 
                             f"✅ {self.preview_url} - API responde (401 esperado)")
            else:
                self.log_test("Preview Environment", False, 
                             f"❌ Resposta inesperada: {response.status_code}")
        except Exception as e:
            self.log_test("Preview Environment", False, f"❌ Erro de conexão: {str(e)}")

    def test_demo_accounts_comparison(self):
        """Test demo accounts in both environments"""
        print("\n=== TESTE 2: COMPARAÇÃO DAS CONTAS DEMO ===")
        
        working_results = {}
        preview_results = {}
        
        for cred in self.demo_credentials:
            print(f"\n🔸 Testando {cred['name']}: {cred['email']}")
            
            login_data = {
                "email": cred["email"],
                "password": cred["password"]
            }
            
            # Test in working environment
            print(f"   📍 Testando no ambiente funcionando...")
            try:
                response = self.make_request(self.working_url, "POST", "/auth/login", login_data)
                
                if response.status_code == 200:
                    data = response.json()
                    working_results[cred["type"]] = {
                        "success": True,
                        "token": data["access_token"],
                        "user": data["user"]
                    }
                    self.log_test(f"Working {cred['name']}", True, 
                                 f"✅ Login funcionando - {data['user'].get('full_name')}")
                else:
                    working_results[cred["type"]] = {
                        "success": False,
                        "status": response.status_code,
                        "error": response.text
                    }
                    self.log_test(f"Working {cred['name']}", False, 
                                 f"❌ Login falhou - Status: {response.status_code}")
                    
            except Exception as e:
                working_results[cred["type"]] = {"success": False, "error": str(e)}
                self.log_test(f"Working {cred['name']}", False, f"❌ Erro: {str(e)}")
            
            # Test in preview environment
            print(f"   📍 Testando no ambiente preview...")
            try:
                response = self.make_request(self.preview_url, "POST", "/auth/login", login_data)
                
                if response.status_code == 200:
                    data = response.json()
                    preview_results[cred["type"]] = {
                        "success": True,
                        "token": data["access_token"],
                        "user": data["user"]
                    }
                    self.log_test(f"Preview {cred['name']}", True, 
                                 f"✅ Login funcionando - {data['user'].get('full_name')}")
                else:
                    preview_results[cred["type"]] = {
                        "success": False,
                        "status": response.status_code,
                        "error": response.text
                    }
                    self.log_test(f"Preview {cred['name']}", False, 
                                 f"❌ Login falhou - Status: {response.status_code}")
                    
            except Exception as e:
                preview_results[cred["type"]] = {"success": False, "error": str(e)}
                self.log_test(f"Preview {cred['name']}", False, f"❌ Erro: {str(e)}")
        
        return working_results, preview_results

    def analyze_differences(self, working_results, preview_results):
        """Analyze differences between environments"""
        print("\n=== TESTE 3: ANÁLISE DAS DIFERENÇAS ===")
        
        working_count = sum(1 for r in working_results.values() if r.get("success"))
        preview_count = sum(1 for r in preview_results.values() if r.get("success"))
        
        print(f"\n📊 ESTATÍSTICAS:")
        print(f"   • Ambiente funcionando: {working_count}/{len(self.demo_credentials)} contas OK")
        print(f"   • Ambiente preview: {preview_count}/{len(self.demo_credentials)} contas OK")
        
        for cred_type in ["cliente", "lojista", "master"]:
            working_ok = working_results.get(cred_type, {}).get("success", False)
            preview_ok = preview_results.get(cred_type, {}).get("success", False)
            
            if working_ok and preview_ok:
                self.log_test(f"Comparison {cred_type.title()}", True, 
                             "✅ Conta funciona em AMBOS os ambientes")
            elif working_ok and not preview_ok:
                self.log_test(f"Comparison {cred_type.title()}", False, 
                             "❌ Conta funciona APENAS no ambiente funcionando")
                
                # Analyze specific error
                preview_error = preview_results.get(cred_type, {})
                if preview_error.get("status") == 401:
                    print(f"      🔍 Causa provável: Conta não existe no banco do preview")
                elif preview_error.get("status") == 500:
                    print(f"      🔍 Causa provável: Erro no servidor do preview")
                    
            elif preview_ok and not working_ok:
                self.log_test(f"Comparison {cred_type.title()}", True, 
                             "⚠️ Conta funciona APENAS no preview")
            else:
                self.log_test(f"Comparison {cred_type.title()}", False, 
                             "❌ Conta NÃO funciona em NENHUM ambiente")

    def investigate_database_differences(self, working_results, preview_results):
        """Investigate database differences using master account"""
        print("\n=== TESTE 4: INVESTIGAÇÃO DO BANCO DE DADOS ===")
        
        # Try to use master account to investigate database
        working_master = working_results.get("master", {})
        preview_master = preview_results.get("master", {})
        
        if working_master.get("success"):
            print(f"\n🔍 Investigando banco do ambiente funcionando...")
            self.investigate_database(self.working_url, working_master["token"], "Working")
        
        if preview_master.get("success"):
            print(f"\n🔍 Investigando banco do ambiente preview...")
            self.investigate_database(self.preview_url, preview_master["token"], "Preview")
        
        if not working_master.get("success") and not preview_master.get("success"):
            self.log_test("Database Investigation", False, 
                         "❌ Não foi possível investigar - Master não funciona em nenhum ambiente")

    def investigate_database(self, base_url: str, master_token: str, env_name: str):
        """Investigate database using master token"""
        try:
            # Try to get user list
            response = self.make_request(base_url, "GET", "/admin/users", token=master_token)
            
            if response.status_code == 200:
                data = response.json()
                total_users = data.get("total_count", 0)
                clients = data.get("clients", 0)
                merchants = data.get("merchants", 0)
                
                self.log_test(f"{env_name} Database Stats", True, 
                             f"✅ {total_users} usuários ({clients} clientes, {merchants} lojistas)")
                
                # Check for demo accounts
                users_list = data.get("users", [])
                demo_emails = ["cliente@demo.com", "lojista@demo.com"]
                found_demos = [u["email"] for u in users_list if u.get("email") in demo_emails]
                
                if found_demos:
                    self.log_test(f"{env_name} Demo Accounts", True, 
                                 f"✅ Contas demo encontradas: {found_demos}")
                else:
                    self.log_test(f"{env_name} Demo Accounts", False, 
                                 "❌ Contas demo NÃO encontradas no banco")
                    
            else:
                self.log_test(f"{env_name} Database Access", False, 
                             f"❌ Erro ao acessar dados: {response.status_code}")
                
        except Exception as e:
            self.log_test(f"{env_name} Database Investigation", False, 
                         f"❌ Erro na investigação: {str(e)}")

    def create_demo_accounts_if_needed(self, preview_results):
        """Create demo accounts in preview environment if they don't exist"""
        print("\n=== TESTE 5: CRIAÇÃO DE CONTAS DEMO NO PREVIEW ===")
        
        # Check if any accounts are missing
        missing_accounts = []
        for cred in self.demo_credentials:
            if not preview_results.get(cred["type"], {}).get("success"):
                missing_accounts.append(cred)
        
        if not missing_accounts:
            self.log_test("Demo Accounts Creation", True, 
                         "✅ Todas as contas já existem no preview")
            return
        
        print(f"🔧 Tentando criar {len(missing_accounts)} contas faltantes...")
        
        for cred in missing_accounts:
            print(f"\n   📝 Criando {cred['name']}...")
            
            # Prepare registration data
            if cred["type"] == "cliente":
                reg_data = {
                    "email": cred["email"],
                    "password": cred["password"],
                    "full_name": "Cliente Demo",
                    "phone": "11999999999",
                    "user_type": "cliente",
                    "cpf": "12345678901"
                }
            elif cred["type"] == "lojista":
                reg_data = {
                    "email": cred["email"],
                    "password": cred["password"],
                    "full_name": "João Silva",
                    "phone": "11888888888",
                    "user_type": "lojista",
                    "company_name": "Loja Demo LTDA",
                    "cnpj": "12345678000190",
                    "address": "Rua das Flores, 123",
                    "whatsapp": "11888888888",
                    "cashback_rate": 5.0,
                    "state": "São Paulo",
                    "city": "São Paulo",
                    "business_segment": "Alimentação"
                }
            else:  # master
                # Master accounts usually need special creation
                self.log_test(f"Create {cred['name']}", False, 
                             "❌ Conta master precisa ser criada manualmente")
                continue
            
            try:
                response = self.make_request(self.preview_url, "POST", "/auth/register", reg_data)
                
                if response.status_code == 200:
                    self.log_test(f"Create {cred['name']}", True, 
                                 f"✅ Conta criada com sucesso")
                    
                    # Test login with new account
                    login_data = {"email": cred["email"], "password": cred["password"]}
                    login_response = self.make_request(self.preview_url, "POST", "/auth/login", login_data)
                    
                    if login_response.status_code == 200:
                        self.log_test(f"Test New {cred['name']}", True, 
                                     "✅ Login com nova conta funcionando")
                    else:
                        self.log_test(f"Test New {cred['name']}", False, 
                                     f"❌ Login falhou após criação: {login_response.status_code}")
                        
                else:
                    self.log_test(f"Create {cred['name']}", False, 
                                 f"❌ Falha na criação: {response.status_code} - {response.text}")
                    
            except Exception as e:
                self.log_test(f"Create {cred['name']}", False, 
                             f"❌ Erro na criação: {str(e)}")

    def run_complete_investigation(self):
        """Run complete investigation"""
        print("🚨 INVESTIGAÇÃO COMPLETA: CONTAS DEMO NO APP PREVIEW")
        print("=" * 80)
        print("OBJETIVO: Identificar por que contas demo funcionam em um ambiente mas não no outro")
        print("AMBIENTES:")
        print(f"  • Funcionando: {self.working_url}")
        print(f"  • Preview: {self.preview_url}")
        print("=" * 80)
        
        # Step 1: Test accessibility
        self.test_environment_accessibility()
        
        # Step 2: Test demo accounts
        working_results, preview_results = self.test_demo_accounts_comparison()
        
        # Step 3: Analyze differences
        self.analyze_differences(working_results, preview_results)
        
        # Step 4: Investigate databases
        self.investigate_database_differences(working_results, preview_results)
        
        # Step 5: Create missing accounts if possible
        self.create_demo_accounts_if_needed(preview_results)
        
        # Final summary
        self.print_final_summary(working_results, preview_results)
        
        return working_results, preview_results

    def print_final_summary(self, working_results, preview_results):
        """Print final investigation summary"""
        print("\n🎯 RESUMO FINAL DA INVESTIGAÇÃO")
        print("=" * 80)
        
        working_count = sum(1 for r in working_results.values() if r.get("success"))
        preview_count = sum(1 for r in preview_results.values() if r.get("success"))
        total_accounts = len(self.demo_credentials)
        
        print(f"📊 RESULTADOS:")
        print(f"   • Ambiente funcionando: {working_count}/{total_accounts} contas OK")
        print(f"   • Ambiente preview: {preview_count}/{total_accounts} contas OK")
        
        if working_count == total_accounts and preview_count == total_accounts:
            print("\n✅ DIAGNÓSTICO: PROBLEMA RESOLVIDO")
            print("   Todas as contas demo funcionam em ambos os ambientes")
            
        elif working_count == total_accounts and preview_count == 0:
            print("\n❌ DIAGNÓSTICO: BANCOS DIFERENTES")
            print("   • Ambiente funcionando tem todas as contas")
            print("   • Ambiente preview não tem nenhuma conta")
            print("   • SOLUÇÃO: Criar contas demo no banco do preview")
            
        elif working_count == total_accounts and preview_count < total_accounts:
            print("\n⚠️ DIAGNÓSTICO: SINCRONIZAÇÃO PARCIAL")
            print("   • Ambiente funcionando tem todas as contas")
            print("   • Ambiente preview tem apenas algumas contas")
            print("   • SOLUÇÃO: Sincronizar contas faltantes")
            
        else:
            print("\n❌ DIAGNÓSTICO: PROBLEMA COMPLEXO")
            print("   • Ambos os ambientes têm problemas")
            print("   • SOLUÇÃO: Investigação mais profunda necessária")
        
        print(f"\n📋 TOTAL DE TESTES: {len(self.test_results)}")
        passed_tests = sum(1 for r in self.test_results if r["success"])
        print(f"   • Testes aprovados: {passed_tests}")
        print(f"   • Testes falharam: {len(self.test_results) - passed_tests}")
        print(f"   • Taxa de sucesso: {(passed_tests/len(self.test_results)*100):.1f}%")

if __name__ == "__main__":
    investigator = DemoAccountsInvestigator()
    working_results, preview_results = investigator.run_complete_investigation()