#!/usr/bin/env python3
"""
Test Lojista Profile with New Segments and Location Selects
"""

import requests
import json
import time

class LojistaProfileTester:
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

    def test_lojista_profile_features(self):
        """Test lojista profile with focus on segments and location"""
        print("🎯 TESTE ESPECÍFICO: PERFIL LOJISTA COM NOVOS SELECTS")
        print("=" * 80)
        print("OBJETIVO: Testar perfil do lojista com segmentos e localização")
        print("FOCO: Validar campos de segmento de negócio e localização")
        print("=" * 80)
        
        # Step 1: Login as lojista
        print(f"\n--- STEP 1: Login como lojista@demo.com ---")
        login_data = {
            "email": "lojista@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code != 200:
            self.log_test("Lojista Login", False, f"Login failed: {response.status_code}")
            return
            
        data = response.json()
        token = data["access_token"]
        user_data = data["user"]
        
        self.log_test("Lojista Login", True, f"✅ Login successful: {user_data.get('full_name')}")
        
        # Step 2: Get current profile data
        print(f"\n--- STEP 2: Obter dados atuais do perfil ---")
        response = self.make_request("GET", "/user/profile", token=token)
        
        if response.status_code == 200:
            profile_data = response.json()
            self.log_test("Profile Data", True, "✅ Dados do perfil obtidos")
            
            # Display current profile data
            print(f"\n📋 DADOS ATUAIS DO PERFIL LOJISTA:")
            print(f"   • Nome: {profile_data.get('full_name')}")
            print(f"   • Empresa: {profile_data.get('company_name')}")
            print(f"   • CNPJ: {profile_data.get('cnpj')}")
            print(f"   • Endereço: {profile_data.get('address')}")
            print(f"   • Estado: {profile_data.get('state')}")
            print(f"   • Cidade: {profile_data.get('city')}")
            print(f"   • Bairro: {profile_data.get('neighborhood')}")
            print(f"   • Segmento: {profile_data.get('business_segment')}")
            print(f"   • WhatsApp: {profile_data.get('whatsapp')}")
            print(f"   • Taxa Cashback: {profile_data.get('cashback_rate')}%")
            print(f"   • Google Maps: {profile_data.get('google_maps_url')}")
            print(f"   • Menu/Catálogo: {profile_data.get('menu_catalog_url')}")
            
        else:
            self.log_test("Profile Data", False, f"Failed to get profile: {response.status_code}")
            return
        
        # Step 3: Test business segments endpoint
        print(f"\n--- STEP 3: Testar endpoint de segmentos de negócio ---")
        response = self.make_request("GET", "/business-segments/active")
        
        if response.status_code == 200:
            segments_data = response.json()
            segments = segments_data.get('segments', [])
            self.log_test("Business Segments", True, f"✅ {len(segments)} segmentos ativos encontrados")
            
            print(f"\n📋 SEGMENTOS DE NEGÓCIO DISPONÍVEIS:")
            for i, segment in enumerate(segments, 1):
                print(f"   {i}. {segment}")
                
        else:
            self.log_test("Business Segments", False, f"Failed to get segments: {response.status_code}")
        
        # Step 4: Test store filters (location data)
        print(f"\n--- STEP 4: Testar filtros de localização ---")
        response = self.make_request("GET", "/stores/filters")
        
        if response.status_code == 200:
            filters_data = response.json()
            self.log_test("Location Filters", True, "✅ Filtros de localização obtidos")
            
            print(f"\n📋 OPÇÕES DE LOCALIZAÇÃO DISPONÍVEIS:")
            print(f"   • Estados: {filters_data.get('states', [])}")
            print(f"   • Cidades: {filters_data.get('cities', [])}")
            print(f"   • Bairros: {filters_data.get('neighborhoods', [])}")
            print(f"   • Segmentos: {filters_data.get('business_segments', [])}")
            
        else:
            self.log_test("Location Filters", False, f"Failed to get filters: {response.status_code}")
        
        # Step 5: Test profile update with new segment and location
        print(f"\n--- STEP 5: Testar atualização de perfil ---")
        
        # Test updating profile with new segment and location data
        update_data = {
            "company_name": "Loja Demo LTDA",
            "cnpj": "12.345.678/0001-90",
            "address": "Rua das Flores, 456 - São Paulo",
            "whatsapp": "11988888888",
            "state": "São Paulo",
            "city": "São Paulo", 
            "neighborhood": "Vila Madalena",
            "business_segment": "Alimentação",
            "google_maps_url": "https://maps.google.com/demo",
            "menu_catalog_url": "https://agito.ai/cardapio/loja-demo",
            "cashback_rate": 6.0
        }
        
        response = self.make_request("POST", "/user/update-profile", update_data, token=token)
        
        if response.status_code == 200:
            self.log_test("Profile Update", True, "✅ Perfil atualizado com sucesso")
            
            # Verify the update
            response = self.make_request("GET", "/user/profile", token=token)
            if response.status_code == 200:
                updated_profile = response.json()
                
                print(f"\n📋 DADOS ATUALIZADOS DO PERFIL:")
                print(f"   • Bairro: {updated_profile.get('neighborhood')} (atualizado)")
                print(f"   • Segmento: {updated_profile.get('business_segment')}")
                print(f"   • Google Maps: {updated_profile.get('google_maps_url')} (novo)")
                print(f"   • Menu/Catálogo: {updated_profile.get('menu_catalog_url')} (novo)")
                print(f"   • Taxa Cashback: {updated_profile.get('cashback_rate')}% (atualizada)")
                
                self.log_test("Profile Verification", True, "✅ Atualizações verificadas")
            else:
                self.log_test("Profile Verification", False, "Failed to verify updates")
                
        else:
            self.log_test("Profile Update", False, f"Failed to update profile: {response.status_code}")
            print(f"   Error: {response.text}")
        
        # Step 6: Test QR Code generation with updated profile
        print(f"\n--- STEP 6: Testar geração de QR Code com perfil atualizado ---")
        qr_request = {"amount": 50.00}
        response = self.make_request("POST", "/merchant/qr-code", qr_request, token=token)
        
        if response.status_code == 200:
            qr_data = response.json()
            self.log_test("QR Code Generation", True, 
                         f"✅ QR Code gerado - Valor: R$ {qr_data.get('amount', 0):.2f}")
            
            print(f"\n📋 DADOS DO QR CODE GERADO:")
            print(f"   • Merchant Name: {qr_data.get('merchant_name')}")
            print(f"   • Cashback Rate: {qr_data.get('cashback_rate')}%")
            print(f"   • Amount: R$ {qr_data.get('amount', 0):.2f}")
            print(f"   • Digital Code: {qr_data.get('digital_code')}")
            
        else:
            self.log_test("QR Code Generation", False, f"Failed to generate QR: {response.status_code}")
        
        # Step 7: Test store search to verify lojista appears in results
        print(f"\n--- STEP 7: Testar busca de lojas ---")
        response = self.make_request("GET", "/stores/search?state=São Paulo&business_segment=Alimentação")
        
        if response.status_code == 200:
            search_data = response.json()
            stores = search_data.get('stores', [])
            
            # Look for our demo lojista
            demo_store = None
            for store in stores:
                if store.get('company_name') == 'Loja Demo LTDA':
                    demo_store = store
                    break
            
            if demo_store:
                self.log_test("Store Search", True, 
                             f"✅ Loja demo encontrada na busca - {demo_store.get('company_name')}")
                
                print(f"\n📋 DADOS DA LOJA NA BUSCA:")
                print(f"   • Nome: {demo_store.get('company_name')}")
                print(f"   • Estado/Cidade: {demo_store.get('state')}/{demo_store.get('city')}")
                print(f"   • Bairro: {demo_store.get('neighborhood')}")
                print(f"   • Segmento: {demo_store.get('business_segment')}")
                print(f"   • Cashback: {demo_store.get('cashback_rate')}%")
                print(f"   • Menu URL: {demo_store.get('menu_catalog_url')}")
                
            else:
                self.log_test("Store Search", False, "Loja demo não encontrada na busca")
                
        else:
            self.log_test("Store Search", False, f"Failed to search stores: {response.status_code}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("🎯 RESUMO DOS TESTES - PERFIL LOJISTA")
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
    tester = LojistaProfileTester()
    
    try:
        tester.test_lojista_profile_features()
    except Exception as e:
        print(f"❌ ERRO CRÍTICO: {e}")
        tester.log_test("Critical Error", False, str(e))
    
    tester.print_summary()

if __name__ == "__main__":
    main()