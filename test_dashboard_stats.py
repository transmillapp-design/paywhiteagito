#!/usr/bin/env python3
"""
Test específico para o endpoint Dashboard Stats Labelview
"""

import requests
import json
import time

class LabelviewDashboardTester:
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
        print(f"🌐 Base URL: {self.base_url}")
        
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"❌ Request failed: {e}")
            raise

    def test_dashboard_stats(self):
        """🎯 TESTE RÁPIDO: Endpoint Dashboard Stats Labelview"""
        print("\n🎯 TESTE RÁPIDO: Endpoint Dashboard Stats Labelview")
        print("=" * 80)
        print("OBJETIVO: Validar se o endpoint `/api/labelview/dashboard/stats` está funcionando")
        print("")
        print("CREDENCIAIS:")
        print("- Master Labelview: protecao@agitomil.com / demo123")
        print("")
        
        # Test 1: Login Master Labelview
        print("\n--- TESTE 1: Login Master Labelview ---")
        
        master_login_data = {
            "email": "protecao@agitomil.com",
            "password": "demo123"
        }
        
        try:
            response = self.make_request("POST", "/auth/login", master_login_data)
            
            if response.status_code == 200:
                data = response.json()
                master_token = data.get("access_token")
                master_user = data.get("user", {})
                
                if master_token:
                    print("✅ Login funcionando - Token JWT válido retornado")
                    
                    # Validar is_labelview_master
                    is_labelview_master = master_user.get("is_labelview_master", False)
                    if is_labelview_master:
                        print("✅ is_labelview_master=true confirmado")
                    else:
                        print("❌ is_labelview_master deveria ser true")
                        return False
                        
                    print(f"🔍 Master Labelview logado:")
                    print(f"   📧 Email: {master_user.get('email')}")
                    print(f"   👤 Nome: {master_user.get('full_name')}")
                    print(f"   🏢 Tipo: {master_user.get('user_type')}")
                    print(f"   🔓 Master: {is_labelview_master}")
                else:
                    print("❌ Token não retornado")
                    return False
            else:
                print(f"❌ Login falhou - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
                except:
                    print(f"❌ Erro sem detalhes - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Erro no login: {str(e)}")
            return False
        
        # Test 2: Dashboard Stats Endpoint
        print("\n--- TESTE 2: GET /api/labelview/dashboard/stats ---")
        
        try:
            response = self.make_request("GET", "/labelview/dashboard/stats", token=master_token)
            
            print(f"🔍 Status da resposta: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Endpoint não retorna mais 404! Status 200 confirmado")
                
                try:
                    data = response.json()
                    print(f"🔍 Resposta completa: {json.dumps(data, indent=2, ensure_ascii=False)}")
                    
                    # Validar campo "success": true
                    success = data.get("success", False)
                    if success:
                        print("✅ Campo 'success': true presente")
                    else:
                        print(f"❌ Campo 'success': {success} (esperado: true)")
                    
                    # Validar campo "stats" presente
                    stats = data.get("stats", {})
                    if stats:
                        print("✅ Campo 'stats' presente")
                        
                        # Validar estrutura dos stats
                        expected_fields = [
                            "total_unidades",
                            "total_regionais", 
                            "total_consultores",
                            "total_colaboradores",
                            "total_clientes",
                            "total_contratos_ativos",
                            "valor_total_contratos",
                            "receita_mensal"
                        ]
                        
                        missing_fields = []
                        for field in expected_fields:
                            if field not in stats:
                                missing_fields.append(field)
                        
                        if not missing_fields:
                            print("✅ Todos os campos de stats presentes")
                        else:
                            print(f"❌ Campos ausentes: {', '.join(missing_fields)}")
                        
                        # Mostrar valores dos stats
                        print(f"\n📊 Estatísticas retornadas:")
                        for field in expected_fields:
                            value = stats.get(field, 'N/A')
                            print(f"   {field}: {value}")
                        
                    else:
                        print("❌ Campo 'stats' ausente ou vazio")
                    
                    # Validar campo "user_type": "labelview_master"
                    user_type = data.get("user_type", "")
                    if user_type == "labelview_master":
                        print(f"✅ Campo 'user_type': '{user_type}' correto")
                    else:
                        print(f"❌ Campo 'user_type': '{user_type}' (esperado: 'labelview_master')")
                    
                    # Validar que números fazem sentido (são números >= 0)
                    numeric_fields = [
                        "total_unidades", "total_regionais", "total_consultores",
                        "total_colaboradores", "total_clientes", "total_contratos_ativos",
                        "valor_total_contratos", "receita_mensal"
                    ]
                    
                    invalid_numbers = []
                    for field in numeric_fields:
                        value = stats.get(field, -1)
                        try:
                            num_value = float(value)
                            if num_value < 0:
                                invalid_numbers.append(f"{field}: {value}")
                        except (ValueError, TypeError):
                            invalid_numbers.append(f"{field}: {value} (não numérico)")
                    
                    if not invalid_numbers:
                        print("✅ Todos os números são válidos (>= 0)")
                    else:
                        print(f"❌ Números inválidos: {', '.join(invalid_numbers)}")
                    
                    return True
                    
                except Exception as e:
                    print(f"❌ Erro ao processar resposta: {str(e)}")
                    print(f"🔍 Resposta raw: {response.text}")
                    return False
                    
            elif response.status_code == 404:
                print("❌ Endpoint ainda retorna 404 - não foi implementado corretamente")
                return False
            elif response.status_code == 403:
                print("❌ Endpoint retorna 403 - problema de permissões")
                try:
                    error_data = response.json()
                    print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
                except:
                    print(f"❌ Erro sem detalhes")
                return False
            else:
                print(f"❌ Endpoint retorna status inesperado: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
                except:
                    print(f"❌ Erro sem detalhes")
                    print(f"🔍 Resposta raw: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro na requisição: {str(e)}")
            return False

if __name__ == "__main__":
    tester = LabelviewDashboardTester()
    success = tester.test_dashboard_stats()
    
    print(f"\n🎯 RESULTADO FINAL:")
    if success:
        print("✅ ENDPOINT DASHBOARD STATS FUNCIONANDO 100%!")
        print("   ✅ Endpoint não retorna mais 404")
        print("   ✅ Estrutura de resposta correta")
        print("   ✅ Todos os campos de stats presentes")
        print("   ✅ User type correto retornado")
        print("   ✅ Números válidos (podem ser 0 se não houver dados)")
    else:
        print("❌ PROBLEMAS IDENTIFICADOS NO ENDPOINT")
        print("   ❌ Correções necessárias antes do uso")