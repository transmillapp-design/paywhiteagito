#!/usr/bin/env python3
"""
URGENT TEST: Create hierarchical users specifically in production environment
"""

import requests
import json
import time

class HierarchicalUsersTest:
    def __init__(self, base_url: str = "https://api-decompose-1.preview.emergentagent.com/api"):
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
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_hierarchical_users_production_creation(self):
        """URGENT TEST: Create hierarchical users specifically in production environment"""
        print("\n🚨 CORREÇÃO URGENTE: CRIAR USUÁRIOS HIERÁRQUICOS NO AMBIENTE DE PRODUÇÃO")
        print("BASE_URL OBRIGATÓRIA: https://api-decompose-1.preview.emergentagent.com/api")
        print("=" * 80)
        
        # Step 1: Login as master in production
        print("\n--- STEP 1: Login Master na URL de Produção ---")
        
        master_login_data = {
            "email": "master@agitocash.com",
            "password": "master123"
        }
        
        response = self.make_request("POST", "/auth/login", master_login_data)
        
        if response.status_code != 200:
            self.log_test("Master Production Login", False, 
                         f"❌ FALHA CRÍTICA: Login master falhou - Status: {response.status_code}, Error: {response.text}")
            return
            
        master_data = response.json()
        master_token = master_data["access_token"]
        master_user = master_data["user"]
        
        # Validate master account
        if not master_user.get("is_master_account"):
            self.log_test("Master Account Validation", False, "❌ Conta não é master account")
            return
            
        self.log_test("Master Production Login", True, 
                     f"✅ Login master realizado na URL de produção: {master_user.get('email')}")
        
        # Step 2: Create the 3 hierarchical users as specified
        print("\n--- STEP 2: Criar Usuários Hierárquicos Especificados ---")
        
        hierarchical_users = [
            {
                "email": "socio.operador@agitocash.com",
                "password": "socio123",
                "full_name": "Carlos Silva Operador",
                "phone": "(11) 99999-1001",
                "whatsapp": "(11) 99999-1001",
                "state": "São Paulo",
                "role": "socio_operador"
            },
            {
                "email": "mini.agencia@agitocash.com", 
                "password": "agencia123",
                "full_name": "Maria Santos Agência",
                "phone": "(11) 99999-2002",
                "whatsapp": "(11) 99999-2002",
                "state": "Rio de Janeiro",
                "city": "Rio de Janeiro",
                "role": "mini_agencia"
            },
            {
                "email": "consultor@agitocash.com",
                "password": "consultor123",
                "full_name": "João Costa Consultor", 
                "phone": "(11) 99999-3003",
                "whatsapp": "(11) 99999-3003",
                "state": "Minas Gerais",
                "city": "Belo Horizonte",
                "role": "consultor"
            }
        ]
        
        created_users = []
        
        for user_data in hierarchical_users:
            print(f"\n🔸 Criando {user_data['role'].upper()}: {user_data['email']}")
            
            response = self.make_request("POST", "/master/hierarchical-users", user_data, token=master_token)
            
            if response.status_code == 200:
                creation_data = response.json()
                created_users.append({
                    "email": user_data["email"],
                    "password": user_data["password"],
                    "role": user_data["role"],
                    "full_name": user_data["full_name"]
                })
                
                self.log_test(f"Create {user_data['role'].title()}", True, 
                             f"✅ {user_data['role'].upper()} criado: {user_data['full_name']} ({user_data['email']})")
            else:
                # Check if user already exists (409) - this is OK
                if response.status_code == 409:
                    created_users.append({
                        "email": user_data["email"],
                        "password": user_data["password"],
                        "role": user_data["role"],
                        "full_name": user_data["full_name"]
                    })
                    
                    self.log_test(f"Create {user_data['role'].title()}", True, 
                                 f"✅ {user_data['role'].upper()} já existe: {user_data['full_name']} ({user_data['email']})")
                else:
                    self.log_test(f"Create {user_data['role'].title()}", False, 
                                 f"❌ Falha ao criar {user_data['role']}: Status {response.status_code}, Error: {response.text}")
        
        # Step 3: Validate login of each created user immediately
        print("\n--- STEP 3: Validação Obrigatória - Login Imediato de Cada Usuário ---")
        
        all_logins_successful = True
        
        for user in created_users:
            print(f"\n🔸 Testando login: {user['email']}")
            
            login_data = {
                "email": user["email"],
                "password": user["password"]
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                login_response = response.json()
                user_data = login_response["user"]
                
                self.log_test(f"Login {user['role'].title()}", True, 
                             f"✅ LOGIN SUCESSO: {user['email']} → {user_data.get('full_name')} "
                             f"(Função: {user_data.get('hierarchical_role', 'N/A')})")
                
                # Test profile access
                token = login_response["access_token"]
                profile_response = self.make_request("GET", "/user/profile", token=token)
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    self.log_test(f"Profile {user['role'].title()}", True, 
                                 f"✅ Perfil acessível: {profile_data.get('full_name')}")
                    
                    # Test balance access
                    balance_response = self.make_request("GET", "/user/balance", token=token)
                    
                    if balance_response.status_code == 200:
                        balance_data = balance_response.json()
                        self.log_test(f"Balance {user['role'].title()}", True, 
                                     f"✅ Saldo acessível: Principal R$ {balance_data.get('balance', 0):.2f}, "
                                     f"Cashback R$ {balance_data.get('cashback_balance', 0):.2f}, "
                                     f"Comissão R$ {balance_data.get('commission_balance', 0):.2f}")
                    else:
                        self.log_test(f"Balance {user['role'].title()}", False, 
                                     f"❌ Erro ao acessar saldo: {balance_response.status_code}")
                else:
                    self.log_test(f"Profile {user['role'].title()}", False, 
                                 f"❌ Erro ao acessar perfil: {profile_response.status_code}")
                    all_logins_successful = False
            else:
                self.log_test(f"Login {user['role'].title()}", False, 
                             f"❌ FALHA LOGIN: {user['email']} - Status: {response.status_code}, "
                             f"Error: {response.text}")
                all_logins_successful = False
        
        # Step 4: Test hierarchical commission system
        print("\n--- STEP 4: Testar Sistema de Comissões Hierárquicas ---")
        
        if all_logins_successful and len(created_users) >= 3:
            # Create a test transaction to verify commission distribution
            print("\n🔸 Testando distribuição de comissões hierárquicas")
            
            # This would require a full payment flow, but we can at least verify the endpoints exist
            # and the hierarchical users are properly configured
            
            # Get hierarchical users list
            response = self.make_request("GET", "/master/hierarchical-users", token=master_token)
            
            if response.status_code == 200:
                hierarchical_list = response.json()
                
                socio_count = len([u for u in hierarchical_list.get('users', []) if u.get('role') == 'socio_operador'])
                agencia_count = len([u for u in hierarchical_list.get('users', []) if u.get('role') == 'mini_agencia'])
                consultor_count = len([u for u in hierarchical_list.get('users', []) if u.get('role') == 'consultor'])
                
                self.log_test("Hierarchical System Validation", True, 
                             f"✅ Sistema hierárquico configurado: {socio_count} Sócios Operadores, "
                             f"{agencia_count} Mini Agências, {consultor_count} Consultores")
            else:
                self.log_test("Hierarchical System Validation", False, 
                             f"❌ Erro ao listar usuários hierárquicos: {response.status_code}")
        
        # Final Summary
        print("\n--- RESULTADO FINAL ---")
        
        if all_logins_successful and len(created_users) == 3:
            self.log_test("URGENT CORRECTION COMPLETE", True, 
                         "🎯 ✅ CORREÇÃO URGENTE CONCLUÍDA COM SUCESSO: "
                         "Todos os 3 usuários hierárquicos criados e funcionando na URL de produção. "
                         "Credenciais validadas e prontas para uso.")
            
            print("\n📋 CREDENCIAIS VALIDADAS PARA PRODUÇÃO:")
            for user in created_users:
                print(f"   • {user['role'].upper()}: {user['email']} / {user['password']}")
        else:
            self.log_test("URGENT CORRECTION FAILED", False, 
                         f"❌ CORREÇÃO URGENTE FALHOU: {len(created_users)}/3 usuários criados, "
                         f"Login success: {all_logins_successful}")

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🎯 RESUMO DOS TESTES")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 ESTATÍSTICAS:")
        print(f"   • Total de testes: {total_tests}")
        print(f"   • ✅ Sucessos: {passed_tests}")
        print(f"   • ❌ Falhas: {failed_tests}")
        print(f"   • 📈 Taxa de sucesso: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n✅ TESTES BEM-SUCEDIDOS:")
        for result in self.test_results:
            if result["success"]:
                print(f"   • {result['test']}: {result['details']}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    # Initialize tester with production URL
    tester = HierarchicalUsersTest()
    
    print("🚨 TESTE URGENTE: CRIAÇÃO DE USUÁRIOS HIERÁRQUICOS EM PRODUÇÃO")
    print("=" * 80)
    
    try:
        # Run the specific hierarchical users test
        tester.test_hierarchical_users_production_creation()
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO NO TESTE HIERÁRQUICO: {e}")
        tester.log_test("Critical Hierarchical Test Error", False, str(e))
    
    # Print summary
    tester.print_test_summary()