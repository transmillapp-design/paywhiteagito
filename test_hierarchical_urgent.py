#!/usr/bin/env python3
"""
TESTE URGENTE: Verificar API de usuários hierárquicos para master
"""

import requests
import json
import time

class HierarchicalUsersTester:
    def __init__(self):
        # Read backend URL from frontend .env
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        frontend_url = line.split('=', 1)[1].strip()
                        self.base_url = f"{frontend_url}/api"
                        break
                else:
                    self.base_url = "http://localhost:8001/api"
        except:
            self.base_url = "http://localhost:8001/api"
        
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_hierarchical_users_urgent(self):
        """🚨 TESTE URGENTE: Verificar API de usuários hierárquicos para master"""
        print("\n🚨 TESTE URGENTE: VERIFICAR API DE USUÁRIOS HIERÁRQUICOS PARA MASTER")
        print("=" * 80)
        print("PROBLEMA REPORTADO: API /api/master/hierarchical-users não está retornando os 3 usuários hierárquicos")
        print("BANCO TEM: 3 usuários (Carlos Silva Operador, Maria Santos Agência, João Costa Consultor)")
        print("TODOS COM: user_type: 'hierarchical'")
        print(f"URL BASE: {self.base_url}")
        print("=" * 80)
        
        # Test 1: Master Login
        print("\n--- TESTE 1: Login Master ---")
        
        master_credentials = {
            "email": "master@agitocash.com",
            "password": "master123"
        }
        
        response = self.make_request("POST", "/auth/login", master_credentials)
        
        if response.status_code == 200:
            data = response.json()
            master_token = data["access_token"]
            master_user = data["user"]
            
            self.log_test("Master Login", True, 
                         f"✅ LOGIN MASTER FUNCIONANDO - {master_credentials['email']}")
            
            # Verify master account flag
            if master_user.get("is_master_account"):
                self.log_test("Master Account Flag", True, "✅ is_master_account = true")
            else:
                self.log_test("Master Account Flag", False, "❌ is_master_account deveria ser true")
                
        else:
            self.log_test("Master Login", False, 
                         f"❌ LOGIN MASTER FALHOU - Status: {response.status_code}")
            print(f"   Erro: {response.text}")
            return False
        
        # Test 2: API Hierarchical Users
        print("\n--- TESTE 2: GET /api/master/hierarchical-users ---")
        
        response = self.make_request("GET", "/master/hierarchical-users", token=master_token)
        
        if response.status_code == 200:
            data = response.json()
            users = data.get("users", [])
            total = data.get("total", 0)
            
            self.log_test("Hierarchical Users API", True, 
                         f"✅ API RESPONDEU - Total: {total} usuários encontrados")
            
            # Validate expected users
            expected_users = [
                "Carlos Silva",
                "Maria Santos", 
                "João Costa"
            ]
            
            found_users = []
            for user in users:
                full_name = user.get("full_name", "")
                for expected in expected_users:
                    if expected in full_name:
                        found_users.append(full_name)
                        break
            
            if len(found_users) == 3:
                self.log_test("Expected Users Found", True, 
                             f"✅ TODOS OS 3 USUÁRIOS ENCONTRADOS: {found_users}")
            else:
                self.log_test("Expected Users Found", False, 
                             f"❌ APENAS {len(found_users)} USUÁRIOS ENCONTRADOS: {found_users}")
                
            # Test 3: Validate User Data Completeness
            print("\n--- TESTE 3: Validar Dados dos Usuários ---")
            
            for i, user in enumerate(users):
                user_name = user.get("full_name", f"Usuário {i+1}")
                
                # Check required fields
                required_fields = ["id", "email", "full_name", "user_type"]
                missing_fields = [field for field in required_fields if field not in user or not user[field]]
                
                if not missing_fields:
                    self.log_test(f"User Data {user_name}", True, 
                                 f"✅ Dados completos - {user.get('email')} ({user.get('user_type')})")
                else:
                    self.log_test(f"User Data {user_name}", False, 
                                 f"❌ Campos ausentes: {missing_fields}")
                
                # Check hierarchical role if present
                if "hierarchical_role" in user:
                    role = user["hierarchical_role"]
                    expected_roles = ["socio_operador", "mini_agencia", "consultor"]
                    
                    if role in expected_roles:
                        self.log_test(f"User Role {user_name}", True, 
                                     f"✅ Role válido: {role}")
                    else:
                        self.log_test(f"User Role {user_name}", False, 
                                     f"❌ Role inválido: {role}")
                
                # Print detailed user info
                print(f"      • Nome: {user.get('full_name')}")
                print(f"      • Email: {user.get('email')}")
                print(f"      • Tipo: {user.get('user_type')}")
                print(f"      • Role: {user.get('hierarchical_role', 'N/A')}")
                print(f"      • Estado: {user.get('state', 'N/A')}")
                print(f"      • Cidade: {user.get('city', 'N/A')}")
                print()
                
        else:
            self.log_test("Hierarchical Users API", False, 
                         f"❌ API FALHOU - Status: {response.status_code}")
            print(f"   Erro: {response.text}")
            
            # Test alternative endpoints to debug
            print("\n--- TESTE 4: Debug - Verificar Dados no Banco ---")
            
            # Try to access admin users to see what's in the database
            admin_response = self.make_request("GET", "/admin/users", token=master_token)
            
            if admin_response.status_code == 200:
                admin_data = admin_response.json()
                all_users = admin_data.get("users", [])
                
                # Look for hierarchical users in all users
                hierarchical_in_all = [u for u in all_users if u.get("user_type") == "hierarchical"]
                
                self.log_test("Debug - Hierarchical in All Users", True, 
                             f"✅ Encontrados {len(hierarchical_in_all)} usuários com user_type='hierarchical' no banco")
                
                if hierarchical_in_all:
                    print("   Usuários hierárquicos encontrados no banco:")
                    for user in hierarchical_in_all:
                        print(f"      • {user.get('full_name')} - {user.get('email')} - {user.get('hierarchical_role', 'N/A')}")
                else:
                    print("   ❌ NENHUM usuário com user_type='hierarchical' encontrado no banco")
                    
                    # Check if there are users with hierarchical_role field
                    users_with_role = [u for u in all_users if u.get("hierarchical_role")]
                    if users_with_role:
                        self.log_test("Debug - Users with Hierarchical Role", True, 
                                     f"✅ Encontrados {len(users_with_role)} usuários com hierarchical_role")
                        print("   Usuários com hierarchical_role:")
                        for user in users_with_role:
                            print(f"      • {user.get('full_name')} - user_type: {user.get('user_type')} - role: {user.get('hierarchical_role')}")
                    else:
                        self.log_test("Debug - Users with Hierarchical Role", False, 
                                     "❌ NENHUM usuário com hierarchical_role encontrado")
            else:
                self.log_test("Debug - Admin Users Access", False, 
                             f"❌ Não foi possível acessar /admin/users - Status: {admin_response.status_code}")
        
        # Final Summary
        print(f"\n🎯 RESUMO DO TESTE URGENTE:")
        print(f"   • Endpoint testado: GET /api/master/hierarchical-users")
        print(f"   • Credencial master: master@agitocash.com/master123")
        print(f"   • Usuários esperados: 3 (Carlos Silva, Maria Santos, João Costa)")
        print(f"   • Filtro esperado: user_type = 'hierarchical'")
        
        # Print test summary
        passed = sum(1 for r in self.test_results if r["success"])
        total = len(self.test_results)
        print(f"\n📊 RESUMO DOS TESTES:")
        print(f"   • Total de testes: {total}")
        print(f"   • Testes aprovados: {passed}")
        print(f"   • Testes falharam: {total - passed}")
        print(f"   • Taxa de sucesso: {(passed/total*100):.1f}%")
        
        return response.status_code == 200 if 'response' in locals() else False

if __name__ == "__main__":
    tester = HierarchicalUsersTester()
    tester.test_hierarchical_users_urgent()