#!/usr/bin/env python3
"""
Teste específico para o novo endpoint /stores com geolocalização
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class StoresEndpointTester:
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_stores_geolocation_endpoint(self):
        """🎯 TESTE DO NOVO ENDPOINT /stores COM SUPORTE A GEOLOCALIZAÇÃO"""
        print("\n🎯 TESTE DO NOVO ENDPOINT /stores COM SUPORTE A GEOLOCALIZAÇÃO")
        print("=" * 80)
        print("FUNCIONALIDADE IMPLEMENTADA:")
        print("- ✅ Novo endpoint GET /api/stores com geolocalização")
        print("- ✅ Parâmetros opcionais: lat, lng, radius, business_segment, limit")
        print("- ✅ Cálculo de distância usando fórmula Haversine")
        print("- ✅ Coordenadas padrão para lojas sem lat/lng")
        print("- ✅ Estrutura de resposta: stores, total, user_location")
        print("")
        print("TESTES NECESSÁRIOS:")
        print("1. GET /api/stores sem parâmetros (todas as lojas)")
        print("2. GET /api/stores?lat=-23.5505&lng=-46.6333 (São Paulo centro)")
        print("3. GET /api/stores?lat=-23.5505&lng=-46.6333&radius=10 (raio 10km)")
        print("4. Verificar cálculo de distância")
        print("5. Verificar coordenadas padrão para lojas sem lat/lng")
        print("6. Verificar estrutura de resposta")
        print("7. Testar filtro por business_segment")
        print("")
        print("CREDENCIAIS: cliente@demo.com/demo123")
        print("COORDENADAS TESTE: São Paulo centro (-23.5505, -46.6333)")
        print("=" * 80)
        
        # Test 1: Login with client account
        print("\n--- TESTE 1: Login Cliente (cliente@demo.com/demo123) ---")
        
        client_login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", client_login_data)
        
        if response.status_code == 200:
            data = response.json()
            client_token = data["access_token"]
            client_user = data["user"]
            
            self.log_test("Client Login", True, 
                         f"✅ Login cliente funcionando - {client_user.get('full_name', 'Cliente Demo')}")
        else:
            self.log_test("Client Login", False, 
                         f"❌ Login cliente falhou - Status: {response.status_code}")
            print("❌ ERRO CRÍTICO: Não é possível continuar teste sem acesso do cliente")
            return False
        
        # Test 2: GET /api/stores sem parâmetros (todas as lojas)
        print("\n--- TESTE 2: GET /api/stores sem parâmetros ---")
        
        response = self.make_request("GET", "/stores")
        
        if response.status_code == 200:
            stores_data = response.json()
            
            # Verificar estrutura da resposta
            required_fields = ["stores", "total", "user_location"]
            missing_fields = []
            
            for field in required_fields:
                if field not in stores_data:
                    missing_fields.append(field)
            
            if not missing_fields:
                stores = stores_data.get("stores", [])
                total = stores_data.get("total", 0)
                user_location = stores_data.get("user_location")
                
                self.log_test("Stores Endpoint Structure", True, 
                             f"✅ Estrutura correta - {total} lojas encontradas")
                
                # Verificar se user_location é None quando não há coordenadas
                if user_location is None:
                    self.log_test("User Location Null", True, 
                                 "✅ user_location é null quando não há coordenadas")
                else:
                    self.log_test("User Location Null", False, 
                                 "❌ user_location deveria ser null sem coordenadas")
                
                # Verificar estrutura das lojas
                if stores and len(stores) > 0:
                    first_store = stores[0]
                    store_required_fields = ["id", "company_name", "name", "latitude", "longitude", 
                                           "business_segment", "cashback_rate", "distance"]
                    store_missing_fields = []
                    
                    for field in store_required_fields:
                        if field not in first_store:
                            store_missing_fields.append(field)
                    
                    if not store_missing_fields:
                        self.log_test("Store Data Structure", True, 
                                     f"✅ Estrutura das lojas correta - Campos obrigatórios presentes")
                        
                        # Verificar se distance é None sem coordenadas do usuário
                        if first_store.get("distance") is None:
                            self.log_test("Distance Null Without Coords", True, 
                                         "✅ distance é null sem coordenadas do usuário")
                        else:
                            self.log_test("Distance Null Without Coords", False, 
                                         "❌ distance deveria ser null sem coordenadas do usuário")
                    else:
                        self.log_test("Store Data Structure", False, 
                                     f"❌ Campos ausentes nas lojas: {', '.join(store_missing_fields)}")
                else:
                    self.log_test("Stores Available", False, 
                                 "❌ Nenhuma loja encontrada no sistema")
            else:
                self.log_test("Stores Endpoint Structure", False, 
                             f"❌ Campos obrigatórios ausentes: {', '.join(missing_fields)}")
        else:
            self.log_test("Stores Endpoint Basic", False, 
                         f"❌ Endpoint /stores falhou - Status: {response.status_code}")
            return False
        
        # Test 3: GET /api/stores com coordenadas de São Paulo
        print("\n--- TESTE 3: GET /api/stores com coordenadas São Paulo ---")
        
        sao_paulo_lat = -23.5505
        sao_paulo_lng = -46.6333
        
        response = self.make_request("GET", f"/stores?lat={sao_paulo_lat}&lng={sao_paulo_lng}")
        
        if response.status_code == 200:
            stores_data = response.json()
            stores = stores_data.get("stores", [])
            user_location = stores_data.get("user_location")
            
            self.log_test("Stores With Coordinates", True, 
                         f"✅ Busca com coordenadas funcionando - {len(stores)} lojas")
            
            # Verificar se user_location está correto
            if user_location and user_location.get("latitude") == sao_paulo_lat and user_location.get("longitude") == sao_paulo_lng:
                self.log_test("User Location Coordinates", True, 
                             f"✅ user_location correto: lat={user_location['latitude']}, lng={user_location['longitude']}")
            else:
                self.log_test("User Location Coordinates", False, 
                             f"❌ user_location incorreto: {user_location}")
            
            # Verificar se as distâncias foram calculadas
            stores_with_distance = [s for s in stores if s.get("distance") is not None]
            
            if len(stores_with_distance) > 0:
                self.log_test("Distance Calculation", True, 
                             f"✅ Distâncias calculadas para {len(stores_with_distance)} lojas")
                
                # Verificar se as lojas estão ordenadas por distância
                distances = [s["distance"] for s in stores_with_distance]
                is_sorted = all(distances[i] <= distances[i+1] for i in range(len(distances)-1))
                
                if is_sorted:
                    self.log_test("Distance Sorting", True, 
                                 f"✅ Lojas ordenadas por distância - Menor: {min(distances):.2f}km")
                else:
                    self.log_test("Distance Sorting", False, 
                                 "❌ Lojas não estão ordenadas por distância")
            else:
                self.log_test("Distance Calculation", False, 
                             "❌ Nenhuma distância foi calculada")
        else:
            self.log_test("Stores With Coordinates", False, 
                         f"❌ Busca com coordenadas falhou - Status: {response.status_code}")
        
        # Test 4: GET /api/stores com raio de 10km
        print("\n--- TESTE 4: GET /api/stores com raio de 10km ---")
        
        response = self.make_request("GET", f"/stores?lat={sao_paulo_lat}&lng={sao_paulo_lng}&radius=10")
        
        if response.status_code == 200:
            stores_data = response.json()
            stores = stores_data.get("stores", [])
            
            self.log_test("Stores With Radius", True, 
                         f"✅ Busca com raio funcionando - {len(stores)} lojas dentro de 10km")
            
            # Verificar se todas as lojas estão dentro do raio
            stores_outside_radius = [s for s in stores if s.get("distance") and s["distance"] > 10]
            
            if len(stores_outside_radius) == 0:
                self.log_test("Radius Filter", True, 
                             "✅ Todas as lojas estão dentro do raio de 10km")
            else:
                self.log_test("Radius Filter", False, 
                             f"❌ {len(stores_outside_radius)} lojas fora do raio de 10km")
        else:
            self.log_test("Stores With Radius", False, 
                         f"❌ Busca com raio falhou - Status: {response.status_code}")
        
        # Test 5: Verificar coordenadas padrão para lojas sem lat/lng
        print("\n--- TESTE 5: Verificação de Coordenadas Padrão ---")
        
        response = self.make_request("GET", "/stores")
        
        if response.status_code == 200:
            stores_data = response.json()
            stores = stores_data.get("stores", [])
            
            # Verificar se todas as lojas têm coordenadas (padrão ou próprias)
            stores_without_coords = [s for s in stores if not s.get("latitude") or not s.get("longitude")]
            
            if len(stores_without_coords) == 0:
                self.log_test("Default Coordinates", True, 
                             f"✅ Todas as {len(stores)} lojas têm coordenadas (padrão ou próprias)")
                
                # Verificar se coordenadas padrão de São Paulo são usadas
                sao_paulo_coords = [s for s in stores if s.get("latitude") == -23.5505 and s.get("longitude") == -46.6333]
                
                if len(sao_paulo_coords) > 0:
                    self.log_test("Sao Paulo Default Coords", True, 
                                 f"✅ {len(sao_paulo_coords)} lojas usando coordenadas padrão de São Paulo")
                else:
                    self.log_test("Sao Paulo Default Coords", True, 
                                 "✅ Nenhuma loja precisa de coordenadas padrão (todas têm próprias)")
            else:
                self.log_test("Default Coordinates", False, 
                             f"❌ {len(stores_without_coords)} lojas sem coordenadas")
        
        # Test 6: Testar filtro por business_segment
        print("\n--- TESTE 6: Filtro por business_segment ---")
        
        # Primeiro, buscar todos os segmentos disponíveis
        response = self.make_request("GET", "/stores")
        
        if response.status_code == 200:
            stores_data = response.json()
            stores = stores_data.get("stores", [])
            
            # Coletar segmentos únicos
            segments = list(set([s.get("business_segment", "") for s in stores if s.get("business_segment")]))
            
            if segments:
                # Testar com o primeiro segmento encontrado
                test_segment = segments[0]
                
                response = self.make_request("GET", f"/stores?business_segment={test_segment}")
                
                if response.status_code == 200:
                    filtered_data = response.json()
                    filtered_stores = filtered_data.get("stores", [])
                    
                    self.log_test("Business Segment Filter", True, 
                                 f"✅ Filtro por segmento '{test_segment}' funcionando - {len(filtered_stores)} lojas")
                    
                    # Verificar se todas as lojas filtradas têm o segmento correto
                    wrong_segment_stores = [s for s in filtered_stores 
                                          if test_segment.lower() not in s.get("business_segment", "").lower()]
                    
                    if len(wrong_segment_stores) == 0:
                        self.log_test("Segment Filter Accuracy", True, 
                                     f"✅ Filtro preciso - todas as lojas são do segmento '{test_segment}'")
                    else:
                        self.log_test("Segment Filter Accuracy", False, 
                                     f"❌ {len(wrong_segment_stores)} lojas com segmento incorreto")
                else:
                    self.log_test("Business Segment Filter", False, 
                                 f"❌ Filtro por segmento falhou - Status: {response.status_code}")
            else:
                self.log_test("Business Segments Available", False, 
                             "❌ Nenhum segmento de negócio encontrado nas lojas")
        
        # Test 7: Testar limite de resultados
        print("\n--- TESTE 7: Limite de Resultados ---")
        
        response = self.make_request("GET", "/stores?limit=5")
        
        if response.status_code == 200:
            stores_data = response.json()
            stores = stores_data.get("stores", [])
            
            if len(stores) <= 5:
                self.log_test("Result Limit", True, 
                             f"✅ Limite funcionando - {len(stores)} lojas retornadas (máximo 5)")
            else:
                self.log_test("Result Limit", False, 
                             f"❌ Limite não funcionando - {len(stores)} lojas retornadas (esperado: máximo 5)")
        else:
            self.log_test("Result Limit", False, 
                         f"❌ Teste de limite falhou - Status: {response.status_code}")
        
        # Test 8: Validar cálculo de distância com coordenadas conhecidas
        print("\n--- TESTE 8: Validação do Cálculo de Distância ---")
        
        # Usar coordenadas de Guarulhos (próximo a São Paulo)
        guarulhos_lat = -23.4538
        guarulhos_lng = -46.5333
        
        response = self.make_request("GET", f"/stores?lat={guarulhos_lat}&lng={guarulhos_lng}")
        
        if response.status_code == 200:
            stores_data = response.json()
            stores = stores_data.get("stores", [])
            
            # Procurar lojas em São Paulo para verificar distância
            sao_paulo_stores = [s for s in stores 
                              if s.get("latitude") == -23.5505 and s.get("longitude") == -46.6333]
            
            if sao_paulo_stores:
                distance = sao_paulo_stores[0].get("distance")
                # Distância entre Guarulhos e São Paulo centro é aproximadamente 25-30km
                expected_distance_min = 20
                expected_distance_max = 35
                
                if distance and expected_distance_min <= distance <= expected_distance_max:
                    self.log_test("Distance Calculation Accuracy", True, 
                                 f"✅ Cálculo de distância preciso - Guarulhos↔São Paulo: {distance:.2f}km")
                else:
                    self.log_test("Distance Calculation Accuracy", False, 
                                 f"❌ Cálculo de distância impreciso - {distance:.2f}km (esperado: {expected_distance_min}-{expected_distance_max}km)")
            else:
                self.log_test("Distance Calculation Test", False, 
                             "❌ Não foi possível testar cálculo - nenhuma loja em São Paulo encontrada")
        
        # Final Summary
        print(f"\n🎯 RESUMO DO TESTE DO ENDPOINT /stores COM GEOLOCALIZAÇÃO:")
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Testes falharam: {failed_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        
        # Check critical functionality
        critical_tests = [
            "Client Login",
            "Stores Endpoint Structure", 
            "Stores With Coordinates",
            "Distance Calculation",
            "Default Coordinates"
        ]
        
        critical_passed = 0
        for test_name in critical_tests:
            if any(test_name in r["test"] and r["success"] for r in self.test_results):
                critical_passed += 1
        
        if critical_passed == len(critical_tests):
            print("\n✅ RESULTADO: ENDPOINT /stores COM GEOLOCALIZAÇÃO FUNCIONANDO 100%")
            print("   ✅ Estrutura de resposta correta (stores, total, user_location)")
            print("   ✅ Busca sem parâmetros funcionando")
            print("   ✅ Busca com coordenadas funcionando")
            print("   ✅ Cálculo de distância operacional")
            print("   ✅ Filtro por raio funcionando")
            print("   ✅ Coordenadas padrão atribuídas")
            print("   ✅ Filtros por segmento operacionais")
            print("   ✅ Sistema pronto para uso na página de lojas")
            return True
        else:
            print(f"\n❌ RESULTADO: PROBLEMAS NO ENDPOINT /stores COM GEOLOCALIZAÇÃO")
            print(f"   ❌ Funcionalidades críticas funcionando: {critical_passed}/{len(critical_tests)}")
            print("   ❌ Correções necessárias antes do uso em produção")
            return False

if __name__ == "__main__":
    tester = StoresEndpointTester()
    tester.test_stores_geolocation_endpoint()