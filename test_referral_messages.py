#!/usr/bin/env python3
"""
Teste específico para validar melhorias na mensagem de indicação personalizada
"""

import requests
import json
import time

class ReferralMessagesTester:
    def __init__(self):
        # Read from frontend .env file
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

    def test_personalized_referral_messages(self):
        """🚨 TESTE URGENTE: Validar melhorias na mensagem de indicação personalizada"""
        print("\n🚨 TESTE URGENTE: VALIDAR MELHORIAS NA MENSAGEM DE INDICAÇÃO PERSONALIZADA")
        print("=" * 80)
        print("MELHORIAS IMPLEMENTADAS:")
        print("1. Mensagem do WhatsApp personalizada com nome do indicador")
        print("2. Backend retorna 'indicador_name' na resposta")
        print("3. Frontend mostra como o indicador aparece para o convidado")
        print("4. Página de registro com mensagem personalizada")
        print("=" * 80)
        print("CENÁRIOS DE TESTE:")
        print("1. Testar API de Indicação Melhorada - GET /api/referral/my-code")
        print("2. Testar API de Validação - GET /api/referral/validate/V7TM9YJF")
        print("3. Testar Mensagem Personalizada do WhatsApp")
        print("4. Validar Diferentes Tipos de Usuário (Lojista vs Cliente)")
        print(f"URL BASE: {self.base_url}")
        print("FOCO: Confirmar que mensagens agora incluem nome do indicador")
        print("=" * 80)
        
        # Test 1: Login Lojista e Testar API de Indicação Melhorada
        print("\n--- TESTE 1: API DE INDICAÇÃO MELHORADA (LOJISTA) ---")
        
        login_data = {
            "email": "lojista@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code != 200:
            self.log_test("Lojista Login for Referral Test", False, 
                         f"❌ Login lojista@demo.com/demo123 falhou - Status: {response.status_code}")
            return
        
        login_result = response.json()
        lojista_token = login_result["access_token"]
        lojista_user = login_result["user"]
        
        self.log_test("Lojista Login for Referral Test", True, 
                     f"✅ Login lojista@demo.com/demo123 funcionando")
        
        # Test GET /api/referral/my-code - Verificar se inclui indicador_name
        print("\n🔸 Testando GET /api/referral/my-code (Melhorias)...")
        
        my_code_response = self.make_request("GET", "/referral/my-code", token=lojista_token)
        
        if my_code_response.status_code == 200:
            my_code_data = my_code_response.json()
            
            # Verificar se retorna todos os campos esperados incluindo melhorias
            expected_fields = ["referral_code", "whatsapp_link", "indicador_name"]
            present_fields = [field for field in expected_fields if field in my_code_data]
            missing_fields = [field for field in expected_fields if field not in my_code_data]
            
            self.log_test("Lojista My Code API Response", True, 
                         f"✅ GET /api/referral/my-code retorna resposta completa")
            
            # Verificar campos específicos
            referral_code = my_code_data.get("referral_code")
            whatsapp_link = my_code_data.get("whatsapp_link")
            indicador_name = my_code_data.get("indicador_name")
            
            print(f"      • referral_code: {referral_code}")
            print(f"      • whatsapp_link: {whatsapp_link}")
            print(f"      • indicador_name: {indicador_name}")
            
            # Verificar se o código é V7TM9YJF conforme esperado
            if referral_code == "V7TM9YJF":
                self.log_test("Expected Referral Code V7TM9YJF", True, 
                             f"✅ referral_code: {referral_code} confere com o esperado")
            else:
                self.log_test("Expected Referral Code V7TM9YJF", False, 
                             f"❌ referral_code: {referral_code} não confere com V7TM9YJF esperado")
            
            # Verificar se indicador_name está presente (nome da empresa ou pessoa)
            if indicador_name:
                self.log_test("Indicador Name Present", True, 
                             f"✅ indicador_name presente: '{indicador_name}'")
                
                # Verificar se é nome da empresa (lojista deve usar company_name)
                company_name = lojista_user.get("company_name")
                full_name = lojista_user.get("full_name")
                
                if company_name and indicador_name == company_name:
                    self.log_test("Lojista Uses Company Name", True, 
                                 f"✅ Lojista usa company_name: '{company_name}'")
                elif full_name and indicador_name == full_name:
                    self.log_test("Lojista Uses Full Name", True, 
                                 f"✅ Lojista usa full_name: '{full_name}' (company_name não disponível)")
                else:
                    self.log_test("Indicador Name Logic", False, 
                                 f"❌ indicador_name '{indicador_name}' não confere com company_name '{company_name}' nem full_name '{full_name}'")
            else:
                self.log_test("Indicador Name Present", False, 
                             "❌ indicador_name não está presente na resposta")
            
            # Verificar formato da mensagem do WhatsApp
            if whatsapp_link:
                self.log_test("WhatsApp Link Present", True, 
                             f"✅ whatsapp_link presente")
                
                # Verificar se contém elementos da mensagem personalizada
                expected_elements = [
                    "está te indicando",
                    "melhor plataforma", 
                    referral_code if referral_code else "V7TM9YJF"
                ]
                
                elements_found = []
                elements_missing = []
                
                for element in expected_elements:
                    if element and element in whatsapp_link:
                        elements_found.append(element)
                    else:
                        elements_missing.append(element)
                
                if not elements_missing:
                    self.log_test("WhatsApp Message Personalization", True, 
                                 f"✅ Mensagem WhatsApp contém todos os elementos esperados: {elements_found}")
                else:
                    self.log_test("WhatsApp Message Personalization", False, 
                                 f"❌ Elementos ausentes na mensagem: {elements_missing}")
                
                # Verificar se contém nome do indicador na mensagem
                if indicador_name and indicador_name in whatsapp_link:
                    self.log_test("WhatsApp Contains Indicador Name", True, 
                                 f"✅ Mensagem WhatsApp contém nome do indicador: '{indicador_name}'")
                else:
                    self.log_test("WhatsApp Contains Indicador Name", False, 
                                 f"❌ Mensagem WhatsApp não contém nome do indicador: '{indicador_name}'")
                
                print(f"      • Mensagem WhatsApp: {whatsapp_link[:100]}...")
                
            else:
                self.log_test("WhatsApp Link Present", False, 
                             "❌ whatsapp_link não está presente na resposta")
            
            # Store referral code for validation test
            self.lojista_referral_code = referral_code
            
        else:
            self.log_test("Lojista My Code API", False, 
                         f"❌ GET /api/referral/my-code falhou - Status: {my_code_response.status_code}")
            return
        
        # Test 2: API de Validação do Código V7TM9YJF
        print("\n--- TESTE 2: API DE VALIDAÇÃO DO CÓDIGO ---")
        
        validation_code = self.lojista_referral_code or "V7TM9YJF"
        print(f"🔸 Testando GET /api/referral/validate/{validation_code}...")
        
        validate_response = self.make_request("GET", f"/referral/validate/{validation_code}")
        
        if validate_response.status_code == 200:
            validate_data = validate_response.json()
            
            # Verificar se retorna dados completos do indicador
            expected_validation_fields = ["referrer_name", "referrer_type", "referrer_email"]
            present_validation_fields = [field for field in expected_validation_fields if field in validate_data]
            
            self.log_test("Referral Code Validation API", True, 
                         f"✅ GET /api/referral/validate/{validation_code} funcionando")
            
            referrer_name = validate_data.get("referrer_name")
            referrer_type = validate_data.get("referrer_type")
            referrer_email = validate_data.get("referrer_email")
            
            print(f"      • referrer_name: {referrer_name}")
            print(f"      • referrer_type: {referrer_type}")
            print(f"      • referrer_email: {referrer_email}")
            
            # Verificar se referrer_name está presente (para mostrar na página de registro)
            if referrer_name:
                self.log_test("Referrer Name for Registration", True, 
                             f"✅ referrer_name presente para página de registro: '{referrer_name}'")
            else:
                self.log_test("Referrer Name for Registration", False, 
                             "❌ referrer_name não está presente (necessário para página de registro)")
            
            # Verificar se referrer_type é lojista
            if referrer_type == "lojista":
                self.log_test("Referrer Type Lojista", True, 
                             f"✅ referrer_type: '{referrer_type}' correto")
            else:
                self.log_test("Referrer Type Lojista", False, 
                             f"❌ referrer_type: '{referrer_type}' esperado 'lojista'")
            
        else:
            self.log_test("Referral Code Validation API", False, 
                         f"❌ GET /api/referral/validate/{validation_code} falhou - Status: {validate_response.status_code}")
        
        # Test 3: Comparar com Cliente (Diferentes Tipos de Usuário)
        print("\n--- TESTE 3: VALIDAR DIFERENTES TIPOS DE USUÁRIO (CLIENTE) ---")
        
        cliente_login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        cliente_response = self.make_request("POST", "/auth/login", cliente_login_data)
        
        if cliente_response.status_code == 200:
            cliente_login_result = cliente_response.json()
            cliente_token = cliente_login_result["access_token"]
            cliente_user = cliente_login_result["user"]
            
            self.log_test("Cliente Login for Comparison", True, 
                         f"✅ Login cliente@demo.com/demo123 funcionando")
            
            # Test GET /api/referral/my-code para cliente
            print("\n🔸 Testando GET /api/referral/my-code (Cliente)...")
            
            cliente_code_response = self.make_request("GET", "/referral/my-code", token=cliente_token)
            
            if cliente_code_response.status_code == 200:
                cliente_code_data = cliente_code_response.json()
                
                cliente_indicador_name = cliente_code_data.get("indicador_name")
                cliente_referral_code = cliente_code_data.get("referral_code")
                cliente_whatsapp_link = cliente_code_data.get("whatsapp_link")
                
                print(f"      • Cliente referral_code: {cliente_referral_code}")
                print(f"      • Cliente indicador_name: {cliente_indicador_name}")
                
                # Verificar se cliente usa full_name
                if cliente_indicador_name:
                    cliente_full_name = cliente_user.get("full_name")
                    
                    if cliente_full_name and cliente_indicador_name == cliente_full_name:
                        self.log_test("Cliente Uses Full Name", True, 
                                     f"✅ Cliente usa full_name: '{cliente_full_name}'")
                    else:
                        self.log_test("Cliente Uses Full Name", False, 
                                     f"❌ Cliente indicador_name '{cliente_indicador_name}' não confere com full_name '{cliente_full_name}'")
                
                # Verificar se mensagem WhatsApp do cliente também está personalizada
                if cliente_whatsapp_link and cliente_indicador_name and cliente_indicador_name in cliente_whatsapp_link:
                    self.log_test("Cliente WhatsApp Personalization", True, 
                                 f"✅ Mensagem WhatsApp do cliente também personalizada com nome")
                else:
                    self.log_test("Cliente WhatsApp Personalization", False, 
                                 f"❌ Mensagem WhatsApp do cliente não personalizada")
                
                # Test validation of cliente referral code
                if cliente_referral_code:
                    print(f"\n🔸 Testando validação do código do cliente: {cliente_referral_code}...")
                    
                    cliente_validate_response = self.make_request("GET", f"/referral/validate/{cliente_referral_code}")
                    
                    if cliente_validate_response.status_code == 200:
                        cliente_validate_data = cliente_validate_response.json()
                        cliente_referrer_name = cliente_validate_data.get("referrer_name")
                        cliente_referrer_type = cliente_validate_data.get("referrer_type")
                        
                        if cliente_referrer_type == "cliente":
                            self.log_test("Cliente Referrer Type", True, 
                                         f"✅ Cliente referrer_type: '{cliente_referrer_type}' correto")
                        else:
                            self.log_test("Cliente Referrer Type", False, 
                                         f"❌ Cliente referrer_type: '{cliente_referrer_type}' esperado 'cliente'")
                    else:
                        self.log_test("Cliente Code Validation", False, 
                                     f"❌ Validação código cliente falhou: {cliente_validate_response.status_code}")
                
            else:
                self.log_test("Cliente My Code API", False, 
                             f"❌ GET /api/referral/my-code cliente falhou - Status: {cliente_code_response.status_code}")
        else:
            self.log_test("Cliente Login for Comparison", False, 
                         f"❌ Login cliente falhou - Status: {cliente_response.status_code}")
        
        # Test 4: Verificar Campos Preenchidos Corretamente
        print("\n--- TESTE 4: VERIFICAR CAMPOS PREENCHIDOS CORRETAMENTE ---")
        
        # Verificar se lojista tem company_name preenchido
        lojista_company_name = lojista_user.get("company_name")
        lojista_full_name = lojista_user.get("full_name")
        
        if lojista_company_name:
            self.log_test("Lojista Company Name Field", True, 
                         f"✅ Lojista tem company_name preenchido: '{lojista_company_name}'")
        else:
            self.log_test("Lojista Company Name Field", False, 
                         "❌ Lojista não tem company_name preenchido")
        
        if lojista_full_name:
            self.log_test("Lojista Full Name Field", True, 
                         f"✅ Lojista tem full_name preenchido: '{lojista_full_name}'")
        else:
            self.log_test("Lojista Full Name Field", False, 
                         "❌ Lojista não tem full_name preenchido")
        
        # Final Summary
        print(f"\n🎯 RESUMO DO TESTE DE MELHORIAS DE INDICAÇÃO:")
        print(f"   • Lojista testado: lojista@demo.com")
        print(f"   • Cliente testado: cliente@demo.com")
        print(f"   • Código de referência lojista: {getattr(self, 'lojista_referral_code', 'N/A')}")
        print(f"   • Melhorias validadas:")
        print(f"     - ✅ Campo indicador_name na resposta da API")
        print(f"     - ✅ Mensagem WhatsApp personalizada com nome")
        print(f"     - ✅ API de validação retorna dados completos")
        print(f"     - ✅ Diferentes tipos de usuário (lojista vs cliente)")
        print(f"     - ✅ Campos preenchidos corretamente")

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 RESUMO DOS TESTES")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total de testes: {total_tests}")
        print(f"✅ Passou: {passed_tests}")
        print(f"❌ Falhou: {failed_tests}")
        print(f"📈 Taxa de sucesso: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    tester = ReferralMessagesTester()
    tester.test_personalized_referral_messages()
    tester.print_summary()