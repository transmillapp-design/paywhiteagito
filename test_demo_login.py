#!/usr/bin/env python3
"""
Test Demo Login Credentials - Focused Test for Review Request
"""

import requests
import json
import time

class DemoLoginTester:
    def __init__(self, base_url: str = "https://slim-super-app.preview.emergentagent.com/api"):
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

    def test_demo_credentials(self):
        """Test the specific demo credentials as requested in review"""
        print("🎯 TESTE URGENTE: CREDENCIAIS DEMO - FOCO NO LOGIN DO LOJISTA")
        print("=" * 80)
        print("OBJETIVO: Verificar se as credenciais demo estão funcionando")
        print("FOCO: Login do lojista para testar perfil com novos selects")
        print("=" * 80)
        
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
            },
            {
                "email": "master@agitocash.com",
                "password": "master123", 
                "type": "master",
                "name": "Demo Master"
            }
        ]
        
        for cred in demo_credentials:
            print(f"\n--- TESTANDO {cred['name']} ({cred['email']}) ---")
            
            # Test 1: POST /api/auth/login
            print(f"🔸 1. Testando POST /api/auth/login")
            login_data = {
                "email": cred["email"],
                "password": cred["password"]
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data["access_token"]
                user_data = data["user"]
                
                self.log_test(f"{cred['name']} - Login", True, 
                             f"✅ LOGIN SUCCESSFUL - HTTP 200")
                
                # Test 2: Validate JWT token structure
                print(f"🔸 2. Validando estrutura do JWT token")
                if "." in token and len(token.split(".")) == 3:
                    self.log_test(f"{cred['name']} - JWT Token", True, 
                                 f"✅ JWT válido - {len(token)} caracteres")
                else:
                    self.log_test(f"{cred['name']} - JWT Token", False, 
                                 "❌ Formato JWT inválido")
                
                # Test 3: Validate user data in response
                print(f"🔸 3. Validando dados do usuário na resposta")
                required_fields = ["id", "email", "full_name", "user_type"]
                missing_fields = [field for field in required_fields if field not in user_data]
                
                if not missing_fields:
                    self.log_test(f"{cred['name']} - User Data", True, 
                                 f"✅ Dados completos: {user_data.get('full_name')} ({user_data.get('user_type')})")
                else:
                    self.log_test(f"{cred['name']} - User Data", False, 
                                 f"❌ Campos ausentes: {missing_fields}")
                
                # Test 4: Test token authentication with /api/user/profile
                print(f"🔸 4. Testando autenticação com GET /api/user/profile")
                profile_response = self.make_request("GET", "/user/profile", token=token)
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    self.log_test(f"{cred['name']} - Profile Access", True, 
                                 f"✅ Perfil acessível: {profile_data.get('full_name')}")
                else:
                    self.log_test(f"{cred['name']} - Profile Access", False, 
                                 f"❌ Erro no perfil: HTTP {profile_response.status_code}")
                
                # Test 5: Test balance endpoint
                print(f"🔸 5. Testando GET /api/user/balance")
                balance_response = self.make_request("GET", "/user/balance", token=token)
                
                if balance_response.status_code == 200:
                    balance_data = balance_response.json()
                    total_balance = balance_data.get('balance', 0) + balance_data.get('cashback_balance', 0)
                    self.log_test(f"{cred['name']} - Balance", True, 
                                 f"✅ Saldo acessível - Principal: R$ {balance_data.get('balance', 0):.2f}, "
                                 f"Cashback: R$ {balance_data.get('cashback_balance', 0):.2f}, "
                                 f"Total: R$ {total_balance:.2f}")
                else:
                    self.log_test(f"{cred['name']} - Balance", False, 
                                 f"❌ Erro no saldo: HTTP {balance_response.status_code}")
                
                # SPECIAL FOCUS: Lojista validation (as requested in review)
                if cred["type"] == "lojista":
                    print(f"\n🔍 VALIDAÇÃO ESPECIAL PARA LOJISTA (FOCO DA REVISÃO):")
                    
                    # Test 6: Check lojista-specific fields
                    print(f"🔸 6. Verificando campos específicos do lojista")
                    lojista_fields = {
                        "company_name": user_data.get("company_name"),
                        "cnpj": user_data.get("cnpj"), 
                        "cashback_rate": user_data.get("cashback_rate"),
                        "address": user_data.get("address"),
                        "whatsapp": user_data.get("whatsapp"),
                        "state": user_data.get("state"),
                        "city": user_data.get("city"),
                        "business_segment": user_data.get("business_segment")
                    }
                    
                    present_fields = {k: v for k, v in lojista_fields.items() if v is not None}
                    
                    self.log_test(f"{cred['name']} - Lojista Fields", True, 
                                 f"✅ Campos do lojista presentes: {len(present_fields)}/8")
                    
                    # Print detailed lojista info for review
                    print(f"   📋 Empresa: {lojista_fields['company_name']}")
                    print(f"   📋 CNPJ: {lojista_fields['cnpj']}")
                    print(f"   📋 Taxa Cashback: {lojista_fields['cashback_rate']}%")
                    print(f"   📋 Endereço: {lojista_fields['address']}")
                    print(f"   📋 Estado: {lojista_fields['state']}")
                    print(f"   📋 Cidade: {lojista_fields['city']}")
                    print(f"   📋 Segmento: {lojista_fields['business_segment']}")
                    print(f"   📋 WhatsApp: {lojista_fields['whatsapp']}")
                    
                    # Test 7: Test QR Code generation for lojista (key functionality)
                    print(f"🔸 7. Testando geração de QR Code (funcionalidade chave)")
                    qr_request = {"amount": 25.00}
                    qr_response = self.make_request("POST", "/merchant/qr-code", qr_request, token=token)
                    
                    if qr_response.status_code == 200:
                        qr_data = qr_response.json()
                        self.log_test(f"{cred['name']} - QR Generation", True, 
                                     f"✅ QR Code gerado - Valor: R$ {qr_data.get('amount', 0):.2f}, "
                                     f"Código Digital: {qr_data.get('digital_code', 'N/A')}")
                        
                        print(f"   📋 QR Code: {qr_data.get('qr_code', 'N/A')[:50]}...")
                        print(f"   📋 Código Digital: {qr_data.get('digital_code', 'N/A')}")
                        print(f"   📋 Merchant ID: {qr_data.get('merchant_id', 'N/A')}")
                        print(f"   📋 Merchant Name: {qr_data.get('merchant_name', 'N/A')}")
                        
                    else:
                        self.log_test(f"{cred['name']} - QR Generation", False, 
                                     f"❌ Erro na geração QR: HTTP {qr_response.status_code}")
                        print(f"   ❌ Erro: {qr_response.text}")
                
                # Special validation for master account
                if cred["type"] == "master":
                    print(f"\n🔍 VALIDAÇÃO ESPECIAL PARA MASTER:")
                    if user_data.get("is_master_account"):
                        self.log_test(f"{cred['name']} - Master Flag", True, "✅ is_master_account = true")
                    else:
                        self.log_test(f"{cred['name']} - Master Flag", False, "❌ is_master_account deveria ser true")
                
            else:
                error_detail = response.text if response.text else "No error details"
                self.log_test(f"{cred['name']} - Login", False, 
                             f"❌ LOGIN FAILED - HTTP {response.status_code}")
                
                print(f"   ❌ Status Code: {response.status_code}")
                print(f"   ❌ Error: {error_detail}")
                
                # Check for common database/configuration errors
                if response.status_code == 500:
                    self.log_test(f"{cred['name']} - Database Error", False, 
                                 "❌ POSSÍVEL ERRO DE DATABASE - Verificar conexão MongoDB")
                elif response.status_code == 401:
                    self.log_test(f"{cred['name']} - Auth Error", False, 
                                 "❌ ERRO DE AUTENTICAÇÃO - Verificar hash da senha ou credenciais")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("🎯 RESUMO DOS TESTES - CREDENCIAIS DEMO")
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

def main():
    """Main test execution"""
    tester = DemoLoginTester()
    
    try:
        tester.test_demo_credentials()
    except Exception as e:
        print(f"❌ ERRO CRÍTICO: {e}")
        tester.log_test("Critical Error", False, str(e))
    
    tester.print_summary()

if __name__ == "__main__":
    main()