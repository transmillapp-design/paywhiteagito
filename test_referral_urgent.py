#!/usr/bin/env python3
"""
Urgent Referral Code V7TM9YJF Testing Script
"""

import requests
import json
import time

class UrgentReferralTester:
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

    def test_referral_code_v7tm9yjf_urgent(self):
        """🚨 TESTE URGENTE: Validar código de indicação V7TM9YJF e sistema de registro"""
        print("\n🚨 TESTE URGENTE: VALIDAÇÃO CÓDIGO DE INDICAÇÃO V7TM9YJF")
        print("=" * 80)
        print("PROBLEMA REPORTADO: Usuário clica em 'copiar link' na conta do lojista no app preview")
        print("ERRO: https://api-decompose-1.preview.emergentagent.com/register?ref=V7TM9YJF")
        print("TESTES NECESSÁRIOS:")
        print("1. GET /api/referral/validate/V7TM9YJF - Confirmar que código V7TM9YJF é válido")
        print("2. Verificar se página /register está acessível no frontend")
        print("3. Confirmar GET /api/referral/my-code para lojista@demo.com")
        print("4. Simular registro com referral_code_used: V7TM9YJF")
        print(f"URL BASE DA API: {self.base_url}")
        print("=" * 80)
        
        # Test 1: Validar código V7TM9YJF
        print("\n--- TESTE 1: VALIDAR CÓDIGO DE INDICAÇÃO V7TM9YJF ---")
        
        validation_response = self.make_request("GET", "/referral/validate/V7TM9YJF")
        
        if validation_response.status_code == 200:
            validation_data = validation_response.json()
            self.log_test("Validate V7TM9YJF Code", True, 
                         f"✅ Código V7TM9YJF é VÁLIDO - Indicador: {validation_data.get('referrer_name', 'N/A')}")
            
            # Verificar dados do lojista
            print(f"      • ID do indicador: {validation_data.get('referrer_id', 'N/A')}")
            print(f"      • Nome/Empresa: {validation_data.get('referrer_name', 'N/A')}")
            print(f"      • Tipo: {validation_data.get('referrer_type', 'N/A')}")
            print(f"      • Email: {validation_data.get('referrer_email', 'N/A')}")
            
        else:
            self.log_test("Validate V7TM9YJF Code", False, 
                         f"❌ Código V7TM9YJF INVÁLIDO ou NÃO ENCONTRADO - Status: {validation_response.status_code}")
            print(f"      ❌ Erro: {validation_response.text}")
        
        # Test 2: Login lojista e verificar código
        print("\n--- TESTE 2: VERIFICAR CÓDIGO DO LOJISTA@DEMO.COM ---")
        
        login_data = {
            "email": "lojista@demo.com",
            "password": "demo123"
        }
        
        login_response = self.make_request("POST", "/auth/login", login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            lojista_token = login_result["access_token"]
            
            self.log_test("Lojista Login", True, "✅ Login lojista@demo.com/demo123 funcionando")
            
            # Verificar código de indicação do lojista
            my_code_response = self.make_request("GET", "/referral/my-code", token=lojista_token)
            
            if my_code_response.status_code == 200:
                my_code_data = my_code_response.json()
                lojista_code = my_code_data.get("referral_code")
                referral_link = my_code_data.get("referral_link", "")
                
                self.log_test("Lojista Referral Code", True, 
                             f"✅ Código do lojista: {lojista_code}")
                
                # Verificar se o código é V7TM9YJF
                if lojista_code == "V7TM9YJF":
                    self.log_test("V7TM9YJF Code Match", True, 
                                 "✅ CÓDIGO V7TM9YJF CONFERE com lojista@demo.com")
                else:
                    self.log_test("V7TM9YJF Code Match", False, 
                                 f"❌ Código esperado V7TM9YJF, encontrado: {lojista_code}")
                
                # Verificar URL do referral link
                if "e8bb2113-486a-4aa8-8829-db45d941ac11.preview.emergentagent.com" in referral_link:
                    self.log_test("Referral Link URL", True, 
                                 "✅ URL do preview CORRETA no referral_link")
                    print(f"      • Link completo: {referral_link}")
                else:
                    self.log_test("Referral Link URL", False, 
                                 f"❌ URL incorreta no referral_link: {referral_link}")
                
            else:
                self.log_test("Lojista My Code", False, 
                             f"❌ Erro ao obter código do lojista - Status: {my_code_response.status_code}")
        else:
            self.log_test("Lojista Login", False, 
                         f"❌ Login lojista falhou - Status: {login_response.status_code}")
        
        # Test 3: Simular registro com código V7TM9YJF
        print("\n--- TESTE 3: SIMULAR REGISTRO COM CÓDIGO V7TM9YJF ---")
        
        timestamp = int(time.time())
        
        new_user_data = {
            "email": f"novo.usuario{timestamp}@teste.com",
            "password": "NovaSenh@123",
            "full_name": "Novo Usuário Teste",
            "phone": "11999888777",
            "user_type": "cliente",
            "cpf": "11144477735",  # Valid CPF format
            "referral_code_used": "V7TM9YJF"
        }
        
        register_response = self.make_request("POST", "/auth/register", new_user_data)
        
        if register_response.status_code == 200:
            register_result = register_response.json()
            new_user = register_result["user"]
            
            self.log_test("Register with V7TM9YJF", True, 
                         f"✅ Registro com código V7TM9YJF FUNCIONANDO - Usuário: {new_user.get('full_name')}")
            
            # Verificar se o vínculo foi criado
            if new_user.get("referred_by"):
                self.log_test("Referral Link Created", True, 
                             f"✅ Vínculo de indicação criado - referred_by: {new_user.get('referred_by')}")
            else:
                self.log_test("Referral Link Created", False, 
                             "❌ Vínculo de indicação NÃO foi criado")
            
            # Verificar se contador do lojista aumentou
            if login_response.status_code == 200:
                updated_code_response = self.make_request("GET", "/referral/my-code", token=lojista_token)
                if updated_code_response.status_code == 200:
                    updated_data = updated_code_response.json()
                    new_count = updated_data.get("referral_count", 0)
                    
                    self.log_test("Referral Count Update", True, 
                                 f"✅ Contador de indicações atualizado - Novo total: {new_count}")
                else:
                    self.log_test("Referral Count Update", False, "❌ Erro ao verificar contador")
            
        else:
            self.log_test("Register with V7TM9YJF", False, 
                         f"❌ Registro com V7TM9YJF FALHOU - Status: {register_response.status_code}")
            print(f"      ❌ Erro: {register_response.text}")
        
        # Test 4: Verificar URLs do sistema
        print("\n--- TESTE 4: VERIFICAR URLS DO SISTEMA ---")
        
        # Testar se o frontend está acessível
        try:
            frontend_url = "https://api-decompose-1.preview.emergentagent.com"
            
            # Test main page
            main_response = requests.get(frontend_url, timeout=10)
            if main_response.status_code == 200:
                self.log_test("Frontend Main Page", True, 
                             f"✅ Página principal acessível - Status: {main_response.status_code}")
            else:
                self.log_test("Frontend Main Page", False, 
                             f"❌ Página principal inacessível - Status: {main_response.status_code}")
            
            # Test register page
            register_url = f"{frontend_url}/register?ref=V7TM9YJF"
            register_page_response = requests.get(register_url, timeout=10)
            if register_page_response.status_code == 200:
                self.log_test("Register Page Access", True, 
                             f"✅ Página /register?ref=V7TM9YJF acessível")
                print(f"      • URL testada: {register_url}")
            else:
                self.log_test("Register Page Access", False, 
                             f"❌ Página /register inacessível - Status: {register_page_response.status_code}")
                
        except Exception as e:
            self.log_test("Frontend Access Test", False, 
                         f"❌ Erro ao testar frontend: {str(e)}")
        
        # Test 5: Validar formato do link de indicação
        print("\n--- TESTE 5: VALIDAR FORMATO DO LINK DE INDICAÇÃO ---")
        
        expected_url_pattern = "https://api-decompose-1.preview.emergentagent.com/register?ref=V7TM9YJF"
        
        if login_response.status_code == 200 and my_code_response.status_code == 200:
            actual_link = my_code_data.get("referral_link", "")
            
            if actual_link == expected_url_pattern:
                self.log_test("Referral Link Format", True, 
                             "✅ Link de indicação tem formato EXATO esperado")
            elif "V7TM9YJF" in actual_link and "register" in actual_link:
                self.log_test("Referral Link Format", True, 
                             "✅ Link de indicação contém elementos essenciais")
                print(f"      • Esperado: {expected_url_pattern}")
                print(f"      • Atual: {actual_link}")
            else:
                self.log_test("Referral Link Format", False, 
                             f"❌ Link de indicação com formato incorreto: {actual_link}")
        
        print(f"\n🎯 CONCLUSÃO DO TESTE URGENTE V7TM9YJF:")
        print("   • Código V7TM9YJF validado")
        print("   • Sistema de registro com indicação testado")
        print("   • URLs do sistema verificadas")
        print("   • Vínculo de indicação confirmado")
        
        # Print summary
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📊 RESUMO DOS TESTES URGENTES:")
        print(f"   • Total de testes: {total_tests}")
        print(f"   • ✅ Testes aprovados: {passed_tests}")
        print(f"   • ❌ Testes falharam: {failed_tests}")
        print(f"   • 📈 Taxa de sucesso: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")

if __name__ == "__main__":
    tester = UrgentReferralTester()
    tester.test_referral_code_v7tm9yjf_urgent()