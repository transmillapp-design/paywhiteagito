#!/usr/bin/env python3
"""
AgitoCash Hierarchical User Testing
Test hierarchical user creation system for production environment
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class HierarchicalUserTester:
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

    def test_hierarchical_user_creation(self):
        """Test hierarchical user creation system for production environment"""
        print("\n🎯 TESTE URGENTE: CRIAÇÃO DE USUÁRIOS HIERÁRQUICOS NO AMBIENTE DE PRODUÇÃO")
        print("=" * 80)
        
        # Step 1: Login as master
        print("\n--- STEP 1: Login Master no Ambiente de Produção ---")
        
        master_login_data = {
            "email": "master@agitocash.com",
            "password": "master123"
        }
        
        response = self.make_request("POST", "/auth/login", master_login_data)
        
        if response.status_code != 200:
            self.log_test("Master Login Production", False, 
                         f"❌ FALHA NO LOGIN MASTER - Status: {response.status_code}, Error: {response.text}")
            return
            
        master_data = response.json()
        master_token = master_data["access_token"]
        master_user = master_data["user"]
        
        # Validate master account
        if not master_user.get("is_master_account"):
            self.log_test("Master Account Validation", False, "❌ Conta não é master account")
            return
            
        self.log_test("Master Login Production", True, 
                     f"✅ LOGIN MASTER REALIZADO - Email: {master_user['email']}, "
                     f"is_master_account: {master_user['is_master_account']}")
        
        # Step 2: Create the 3 hierarchical users as specified
        print("\n--- STEP 2: Criar os 3 Usuários Hierárquicos Especificados ---")
        
        hierarchical_users = [
            {
                "name": "SÓCIO OPERADOR",
                "data": {
                    "email": "socio.operador@agitocash.com",
                    "full_name": "Carlos Silva Operador",
                    "phone": "(11) 99999-1001",
                    "whatsapp": "(11) 99999-1001",
                    "state": "São Paulo",
                    "role": "socio_operador",
                    "password": "socio123"
                }
            },
            {
                "name": "MINI AGÊNCIA",
                "data": {
                    "email": "mini.agencia@agitocash.com",
                    "full_name": "Maria Santos Agência",
                    "phone": "(11) 99999-2002",
                    "whatsapp": "(11) 99999-2002",
                    "state": "Rio de Janeiro",
                    "city": "Rio de Janeiro",
                    "role": "mini_agencia",
                    "password": "agencia123"
                }
            },
            {
                "name": "CONSULTOR",
                "data": {
                    "email": "consultor@agitocash.com",
                    "full_name": "João Costa Consultor",
                    "phone": "(11) 99999-3003",
                    "whatsapp": "(11) 99999-3003",
                    "state": "Minas Gerais",
                    "city": "Belo Horizonte",
                    "role": "consultor",
                    "password": "consultor123"
                }
            }
        ]
        
        created_users = []
        
        for user_info in hierarchical_users:
            user_name = user_info["name"]
            user_data = user_info["data"]
            
            print(f"\n🔸 Criando {user_name}: {user_data['full_name']}")
            
            response = self.make_request("POST", "/master/hierarchical-users", user_data, token=master_token)
            
            if response.status_code == 200:
                creation_data = response.json()
                created_users.append({
                    "name": user_name,
                    "email": user_data['email'],
                    "password": user_data['password'],
                    "role": user_data['role'],
                    "creation_data": creation_data
                })
                
                self.log_test(f"Create {user_name}", True, 
                             f"✅ {user_name} criado com sucesso - Email: {user_data['email']}, "
                             f"Função: {user_data['role']}, Estado: {user_data['state']}")
                
                print(f"   📋 Detalhes: {creation_data.get('message', 'Usuário criado')}")
                
            else:
                error_detail = response.text if response.text else "No error details"
                self.log_test(f"Create {user_name}", False, 
                             f"❌ FALHA AO CRIAR {user_name} - Status: {response.status_code}, "
                             f"Error: {error_detail}")
        
        # Step 3: Validate login for each created user
        print("\n--- STEP 3: Validar Login dos Usuários Criados ---")
        
        successful_logins = []
        
        for user in created_users:
            print(f"\n🔸 Testando login: {user['name']} ({user['email']})")
            
            login_data = {
                "email": user['email'],
                "password": user['password']
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                login_response = response.json()
                user_data = login_response["user"]
                
                self.log_test(f"Login {user['name']}", True, 
                             f"✅ LOGIN REALIZADO - {user['name']}: {user_data.get('full_name')}, "
                             f"Função: {user_data.get('hierarchical_role', 'N/A')}")
                
                successful_logins.append({
                    "name": user['name'],
                    "email": user['email'],
                    "token": login_response["access_token"],
                    "user_data": user_data
                })
                
                # Test profile access
                profile_response = self.make_request("GET", "/user/profile", token=login_response["access_token"])
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    self.log_test(f"Profile Access {user['name']}", True, 
                                 f"✅ Perfil acessível - {profile_data.get('full_name')}")
                else:
                    self.log_test(f"Profile Access {user['name']}", False, 
                                 f"❌ Erro ao acessar perfil - Status: {profile_response.status_code}")
                
            else:
                error_detail = response.text if response.text else "No error details"
                self.log_test(f"Login {user['name']}", False, 
                             f"❌ FALHA NO LOGIN {user['name']} - Status: {response.status_code}, "
                             f"Error: {error_detail}")
        
        # Step 4: Validate hierarchical system functionality
        print("\n--- STEP 4: Validar Funcionalidades do Sistema Hierárquico ---")
        
        # Test master dashboard access to hierarchical users
        response = self.make_request("GET", "/master/hierarchical-users", token=master_token)
        
        if response.status_code == 200:
            hierarchical_list = response.json()
            total_hierarchical = len(hierarchical_list.get('users', []))
            
            self.log_test("Hierarchical Users List", True, 
                         f"✅ Lista de usuários hierárquicos acessível - Total: {total_hierarchical}")
            
            # Count by role
            roles_count = {}
            for h_user in hierarchical_list.get('users', []):
                role = h_user.get('role', 'unknown')
                roles_count[role] = roles_count.get(role, 0) + 1
            
            print(f"   📊 Distribuição por função:")
            for role, count in roles_count.items():
                print(f"      • {role}: {count}")
                
        else:
            self.log_test("Hierarchical Users List", False, 
                         f"❌ Erro ao acessar lista - Status: {response.status_code}")
        
        # Step 5: Summary and validation
        print("\n--- STEP 5: Resumo e Validação Final ---")
        
        total_created = len(created_users)
        total_login_success = len(successful_logins)
        
        self.log_test("Hierarchical Creation Summary", True, 
                     f"🎯 RESUMO FINAL: {total_created}/3 usuários criados, "
                     f"{total_login_success}/{total_created} logins bem-sucedidos")
        
        if total_created == 3 and total_login_success == 3:
            self.log_test("Production Hierarchical System", True, 
                         "🎉 SISTEMA HIERÁRQUICO FUNCIONANDO 100% NO AMBIENTE DE PRODUÇÃO")
        else:
            self.log_test("Production Hierarchical System", False, 
                         f"⚠️ Sistema parcialmente funcional - Criados: {total_created}, "
                         f"Logins: {total_login_success}")
        
        # Store successful logins for potential further testing
        self.hierarchical_users = successful_logins
        
        return {
            "created_users": created_users,
            "successful_logins": successful_logins,
            "total_created": total_created,
            "total_login_success": total_login_success
        }

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
    print("🎯 TESTE COMPLETO: SISTEMA DE USUÁRIOS HIERÁRQUICOS")
    print("=" * 80)
    
    tester = HierarchicalUserTester()
    
    try:
        # Test hierarchical user creation
        print("\n🔸 TESTE: Criação de Usuários Hierárquicos")
        creation_result = tester.test_hierarchical_user_creation()
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO NOS TESTES HIERÁRQUICOS: {e}")
        tester.log_test("Critical Hierarchical Test Error", False, str(e))
    
    # Print summary
    tester.print_test_summary()