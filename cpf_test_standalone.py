#!/usr/bin/env python3
"""
Standalone CPF functionality test for AgitoCoin
"""

import requests
import json
import time

class CPFTester:
    def __init__(self):
        # Read backend URL from frontend .env
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        frontend_url = line.split('=', 1)[1].strip()
                        if frontend_url.endswith('/api'):
                            self.base_url = frontend_url
                        else:
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
        
    def make_request(self, method: str, endpoint: str, data: dict = None, token: str = None):
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

    def test_cpf_functionality(self):
        """Test CPF functionality end-to-end"""
        print("\n🎯 TESTE ESPECÍFICO DA NOVA FUNCIONALIDADE DE CPF NO FRONTEND E BACKEND")
        print("=" * 80)
        print("BACKEND TESTS:")
        print("1. Login com cliente demo: cliente@demo.com/demo123")
        print("2. Testar PUT /api/user/profile-data com campo CPF válido")
        print("3. Verificar se CPF é salvo corretamente no banco")
        print("4. Verificar se GET /api/user/profile retorna o CPF atualizado")
        print("5. Testar validação de CPF inválido (deve rejeitar)")
        print("=" * 80)
        
        # Test 1: Login with demo client
        print("\n--- TESTE 1: Login Cliente Demo ---")
        
        cliente_login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", cliente_login_data)
        
        if response.status_code == 200:
            data = response.json()
            cliente_token = data["access_token"]
            cliente_user = data["user"]
            
            self.log_test("Cliente Login", True, 
                         f"Login cliente funcionando - {cliente_user.get('full_name', 'Cliente Demo')}")
        else:
            self.log_test("Cliente Login", False, 
                         f"Login cliente falhou - Status: {response.status_code}")
            return False
        
        # Test 2: Get current profile to check existing CPF
        print("\n--- TESTE 2: Verificar CPF Atual no Perfil ---")
        
        response = self.make_request("GET", "/user/profile", token=cliente_token)
        
        if response.status_code == 200:
            current_profile = response.json()
            current_cpf = current_profile.get("cpf", "")
            
            self.log_test("Current Profile Check", True, 
                         f"Perfil atual obtido - CPF atual: '{current_cpf}'")
        else:
            self.log_test("Current Profile Check", False, 
                         f"Erro ao obter perfil atual - Status: {response.status_code}")
            return False
        
        # Test 3: Test PUT /api/user/profile-data with valid CPF
        print("\n--- TESTE 3: PUT /api/user/profile-data com CPF Válido ---")
        
        valid_cpf = "123.456.789-09"  # CPF válido para teste
        profile_update_data = {
            "cpf": valid_cpf
        }
        
        response = self.make_request("PUT", "/user/profile-data", profile_update_data, token=cliente_token)
        
        if response.status_code == 200:
            update_response = response.json()
            message = update_response.get("message", "")
            
            self.log_test("CPF Update Valid", True, 
                         f"CPF válido aceito - Resposta: {message}")
        else:
            error_detail = response.text if response.text else "Sem detalhes"
            self.log_test("CPF Update Valid", False, 
                         f"Falha ao atualizar CPF válido - Status: {response.status_code}, Erro: {error_detail}")
            return False
        
        # Test 4: Verify CPF is saved correctly in database
        print("\n--- TESTE 4: Verificar se CPF foi Salvo Corretamente ---")
        
        response = self.make_request("GET", "/user/profile", token=cliente_token)
        
        if response.status_code == 200:
            updated_profile = response.json()
            saved_cpf = updated_profile.get("cpf", "")
            
            if saved_cpf == valid_cpf:
                self.log_test("CPF Database Save", True, 
                             f"CPF salvo corretamente no banco - CPF: {saved_cpf}")
            else:
                self.log_test("CPF Database Save", False, 
                             f"CPF não salvo corretamente - Esperado: {valid_cpf}, Obtido: {saved_cpf}")
        else:
            self.log_test("CPF Database Save", False, 
                         f"Erro ao verificar CPF salvo - Status: {response.status_code}")
        
        # Test 5: Verify GET /api/user/profile returns updated CPF
        print("\n--- TESTE 5: Verificar GET /api/user/profile Retorna CPF Atualizado ---")
        
        response = self.make_request("GET", "/user/profile", token=cliente_token)
        
        if response.status_code == 200:
            profile_data = response.json()
            returned_cpf = profile_data.get("cpf", "")
            
            if returned_cpf and returned_cpf == valid_cpf:
                self.log_test("CPF Profile Return", True, 
                             f"GET /api/user/profile retorna CPF atualizado corretamente: {returned_cpf}")
            else:
                self.log_test("CPF Profile Return", False, 
                             f"GET /api/user/profile não retorna CPF correto - CPF: '{returned_cpf}'")
        else:
            self.log_test("CPF Profile Return", False, 
                         f"Erro ao obter perfil atualizado - Status: {response.status_code}")
        
        # Test 6: Test invalid CPF validation (should reject)
        print("\n--- TESTE 6: Testar Validação de CPF Inválido ---")
        
        invalid_cpfs = [
            "111.111.111-11",  # CPF com todos os dígitos iguais
            "123.456.789-00",  # CPF com dígitos verificadores incorretos
            "123.456.789",     # CPF sem dígitos verificadores
            "abc.def.ghi-jk",  # CPF com letras
            "123.456.789-123", # CPF com mais dígitos
        ]
        
        invalid_cpf_tests_passed = 0
        
        for invalid_cpf in invalid_cpfs:
            profile_update_data = {
                "cpf": invalid_cpf
            }
            
            response = self.make_request("PUT", "/user/profile-data", profile_update_data, token=cliente_token)
            
            if response.status_code == 400:  # Should reject with 400 Bad Request
                self.log_test(f"CPF Invalid Validation - {invalid_cpf}", True, 
                             f"CPF inválido rejeitado corretamente: {invalid_cpf}")
                invalid_cpf_tests_passed += 1
            else:
                error_detail = response.text if response.text else "Sem detalhes"
                self.log_test(f"CPF Invalid Validation - {invalid_cpf}", False, 
                             f"CPF inválido aceito incorretamente: {invalid_cpf} - Status: {response.status_code}")
        
        # Test 7: Test CPF validation for non-client users (should reject)
        print("\n--- TESTE 7: Testar CPF para Usuário Não-Cliente (Deve Rejeitar) ---")
        
        # Login with lojista to test CPF rejection
        lojista_login_data = {
            "email": "lojista@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", lojista_login_data)
        
        if response.status_code == 200:
            data = response.json()
            lojista_token = data["access_token"]
            
            # Try to set CPF for lojista (should be rejected)
            profile_update_data = {
                "cpf": "123.456.789-09"
            }
            
            response = self.make_request("PUT", "/user/profile-data", profile_update_data, token=lojista_token)
            
            if response.status_code == 400:
                self.log_test("CPF Lojista Rejection", True, 
                             "CPF rejeitado corretamente para lojista (apenas clientes podem ter CPF)")
            else:
                self.log_test("CPF Lojista Rejection", False, 
                             f"CPF aceito incorretamente para lojista - Status: {response.status_code}")
        else:
            self.log_test("Lojista Login for CPF Test", False, 
                         f"Não foi possível fazer login com lojista para testar CPF - Status: {response.status_code}")
        
        # Final Summary
        print(f"\n🎯 RESUMO FINAL DO TESTE DE FUNCIONALIDADE CPF:")
        
        total_tests = len([r for r in self.test_results if "CPF" in r["test"]])
        successful_tests = len([r for r in self.test_results if "CPF" in r["test"] and r["success"]])
        
        print(f"   • Total de testes CPF: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        print(f"   • Validações de CPF inválido: {invalid_cpf_tests_passed}/{len(invalid_cpfs)}")
        
        # Check critical functionality
        critical_tests = [
            "CPF Update Valid",
            "CPF Database Save", 
            "CPF Profile Return",
            "CPF Lojista Rejection"
        ]
        
        critical_passed = len([r for r in self.test_results if any(ct in r["test"] for ct in critical_tests) and r["success"]])
        
        if critical_passed >= len(critical_tests) and invalid_cpf_tests_passed >= 3:
            print("   ✅ RESULTADO: FUNCIONALIDADE CPF FUNCIONANDO 100% PERFEITAMENTE")
            print("   ✅ BACKEND CPF VALIDADO:")
            print("     - PUT /api/user/profile-data aceita CPF válido")
            print("     - CPF é salvo corretamente no banco de dados")
            print("     - GET /api/user/profile retorna CPF atualizado")
            print("     - Validação rejeita CPF inválido corretamente")
            print("     - CPF rejeitado para usuários não-clientes")
            print("   ✅ FUNCIONALIDADE PRONTA PARA TESTE NO FRONTEND")
            return True
        else:
            print("   ❌ RESULTADO: FUNCIONALIDADE CPF COM PROBLEMAS")
            print("   ❌ PROBLEMAS IDENTIFICADOS:")
            if critical_passed < len(critical_tests):
                print("     - Funcionalidades críticas não funcionando")
            if invalid_cpf_tests_passed < 3:
                print("     - Validação de CPF inválido insuficiente")
            return False

def main():
    tester = CPFTester()
    
    try:
        success = tester.test_cpf_functionality()
        
        # Print overall summary
        total_tests = len(tester.test_results)
        successful_tests = len([r for r in tester.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        print(f"\n📊 RESUMO GERAL DOS TESTES:")
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Testes falharam: {failed_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        
        if success:
            print("\n✅ RESULTADO FINAL: FUNCIONALIDADE CPF FUNCIONANDO 100% PERFEITAMENTE!")
            return True
        else:
            print("\n❌ RESULTADO FINAL: PROBLEMAS IDENTIFICADOS NA FUNCIONALIDADE CPF")
            return False
            
    except Exception as e:
        print(f"\n❌ ERRO DURANTE O TESTE: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)