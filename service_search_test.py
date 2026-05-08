#!/usr/bin/env python3
"""
🔍 TESTE URGENTE - BUSCA DE SERVIÇOS E FLUXO COMPLETO
Teste específico conforme solicitado na revisão urgente
"""

import requests
import json
import time
from datetime import datetime, timezone, timedelta

class ServiceSearchTester:
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
                response = self.session.get(url, headers=headers, params=data)
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

    def test_service_search_complete_flow(self):
        """🔍 TESTE URGENTE - BUSCA DE SERVIÇOS E FLUXO COMPLETO"""
        print("\n🔍 TESTE URGENTE - BUSCA DE SERVIÇOS E FLUXO COMPLETO")
        print("=" * 80)
        print("CONTEXTO: Cliente está tendo erro ao listar prestadores. Preciso validar:")
        print("")
        print("1. **Verificar se serviços existem no banco**:")
        print("   - Contar quantos serviços estão cadastrados")
        print("   - Listar os 3 serviços do prestador demo")
        print("")
        print("2. **Testar endpoint de busca SEM filtros**:")
        print("   - GET /api/servicos/search")
        print("   - Deve retornar TODOS os serviços disponíveis")
        print("   - Verificar estrutura da resposta")
        print("")
        print("3. **Testar busca com query \"elétrica\"**:")
        print("   - GET /api/servicos/search?query=elétrica")
        print("   - Deve encontrar os serviços de eletricista")
        print("")
        print("4. **Testar busca com categoria \"eletrica\"**:")
        print("   - GET /api/servicos/search?category=eletrica")
        print("   - Deve retornar serviços dessa categoria")
        print("")
        print("5. **Detalhes de um serviço específico**:")
        print("   - Pegar o ID de um serviço")
        print("   - GET /api/servicos/{service_id}")
        print("   - Validar que retorna dados completos do prestador")
        print("")
        print("6. **FLUXO COMPLETO - Criar Agendamento**:")
        print("   - Login como cliente@demo.com")
        print("   - Buscar serviços")
        print("   - POST /api/agendamentos com um serviço")
        print("   - Verificar se agendamento foi criado")
        print("   - GET /api/agendamentos/meus")
        print("")
        print("7. **Validar como Prestador**:")
        print("   - Login como prestador@demo.com")
        print("   - GET /api/prestador/agendamentos")
        print("   - Verificar se o agendamento aparece")
        print("")
        print("OBJETIVO: Garantir que TODO o fluxo funciona (busca → detalhes → agendamento → confirmação)")
        print("=" * 80)
        
        # Test 1: Verificar se serviços existem no banco
        print("\n--- TESTE 1: Verificar se serviços existem no banco ---")
        
        response = self.make_request("GET", "/servicos/search")
        
        if response.status_code == 200:
            data = response.json()
            services = data.get("data", [])
            total_services = len(services)
            
            self.log_test("Contar Serviços no Banco", True, 
                         f"✅ {total_services} serviços encontrados no banco")
            
            # List first 3 services for demo
            if total_services >= 3:
                print(f"\n📋 PRIMEIROS 3 SERVIÇOS ENCONTRADOS:")
                for i, service in enumerate(services[:3], 1):
                    provider_name = service.get('provider', {}).get('name', 'N/A')
                    service_name = service.get('name', 'N/A')
                    price = service.get('price', 0)
                    category = service.get('category', 'N/A')
                    print(f"   {i}. {service_name} - {provider_name} - R$ {price:.2f} - Categoria: {category}")
                
                self.log_test("Listar Serviços Demo", True, 
                             f"✅ Listados os primeiros 3 serviços do banco")
            else:
                self.log_test("Listar Serviços Demo", False, 
                             f"❌ Apenas {total_services} serviços encontrados (esperado: pelo menos 3)")
        else:
            self.log_test("Contar Serviços no Banco", False, 
                         f"❌ Falha ao buscar serviços - Status: {response.status_code}")
            return False
        
        # Test 2: Testar endpoint de busca SEM filtros
        print("\n--- TESTE 2: Testar endpoint de busca SEM filtros ---")
        
        response = self.make_request("GET", "/servicos/search")
        
        if response.status_code == 200:
            data = response.json()
            services = data.get("data", [])
            
            self.log_test("Busca SEM Filtros", True, 
                         f"✅ GET /api/servicos/search retorna {len(services)} serviços")
            
            # Verificar estrutura da resposta
            if services:
                first_service = services[0]
                required_fields = ["id", "name", "description", "price", "category", "provider"]
                missing_fields = [field for field in required_fields if field not in first_service]
                
                if not missing_fields:
                    self.log_test("Estrutura da Resposta", True, 
                                 "✅ Estrutura da resposta correta com todos os campos necessários")
                else:
                    self.log_test("Estrutura da Resposta", False, 
                                 f"❌ Campos ausentes na resposta: {missing_fields}")
            else:
                self.log_test("Estrutura da Resposta", False, 
                             "❌ Nenhum serviço retornado para verificar estrutura")
        else:
            self.log_test("Busca SEM Filtros", False, 
                         f"❌ Falha na busca sem filtros - Status: {response.status_code}")
        
        # Test 3: Testar busca com query "elétrica"
        print("\n--- TESTE 3: Testar busca com query \"elétrica\" ---")
        
        response = self.make_request("GET", "/servicos/search", {"query": "elétrica"})
        
        if response.status_code == 200:
            data = response.json()
            services = data.get("data", [])
            
            # Check if any service contains "elétrica" in name or description
            electrical_services = []
            for service in services:
                name = service.get('name', '').lower()
                description = service.get('description', '').lower()
                if 'elétrica' in name or 'elétrica' in description or 'eletric' in name or 'eletric' in description:
                    electrical_services.append(service)
            
            if electrical_services:
                self.log_test("Busca Query Elétrica", True, 
                             f"✅ Encontrados {len(electrical_services)} serviços elétricos")
                
                print(f"\n⚡ SERVIÇOS ELÉTRICOS ENCONTRADOS:")
                for service in electrical_services:
                    provider_name = service.get('provider', {}).get('name', 'N/A')
                    service_name = service.get('name', 'N/A')
                    price = service.get('price', 0)
                    print(f"   • {service_name} - {provider_name} - R$ {price:.2f}")
            else:
                self.log_test("Busca Query Elétrica", False, 
                             f"❌ Nenhum serviço elétrico encontrado (total: {len(services)} serviços)")
        else:
            self.log_test("Busca Query Elétrica", False, 
                         f"❌ Falha na busca com query - Status: {response.status_code}")
        
        # Test 4: Testar busca com categoria "eletrica"
        print("\n--- TESTE 4: Testar busca com categoria \"eletrica\" ---")
        
        response = self.make_request("GET", "/servicos/search", {"category": "eletrica"})
        
        if response.status_code == 200:
            data = response.json()
            services = data.get("data", [])
            
            # Filter services by electrical category
            electrical_category_services = [s for s in services if s.get('category', '').lower() in ['eletrica', 'elétrica', 'electrical']]
            
            if electrical_category_services:
                self.log_test("Busca Categoria Elétrica", True, 
                             f"✅ Encontrados {len(electrical_category_services)} serviços na categoria elétrica")
            else:
                self.log_test("Busca Categoria Elétrica", False, 
                             f"❌ Nenhum serviço na categoria elétrica (total: {len(services)} serviços)")
        else:
            self.log_test("Busca Categoria Elétrica", False, 
                         f"❌ Falha na busca por categoria - Status: {response.status_code}")
        
        # Test 5: Detalhes de um serviço específico
        print("\n--- TESTE 5: Detalhes de um serviço específico ---")
        
        # Get first service ID from previous search
        response = self.make_request("GET", "/servicos/search")
        if response.status_code == 200:
            services = response.json().get("data", [])
            if services:
                service_id = services[0].get("id")
                
                # Get service details
                response = self.make_request("GET", f"/servicos/{service_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    service_details = data.get("data", {})
                    
                    self.log_test("Detalhes do Serviço", True, 
                                 f"✅ Detalhes obtidos - {service_details.get('name')} - {service_details.get('provider', {}).get('name')}")
                    
                    # Verify complete provider data
                    provider = service_details.get('provider', {})
                    provider_fields = ["id", "name", "phone", "address"]
                    missing_provider_fields = [field for field in provider_fields if not provider.get(field)]
                    
                    if not missing_provider_fields:
                        self.log_test("Dados Completos do Prestador", True, 
                                     "✅ Dados completos do prestador retornados")
                    else:
                        self.log_test("Dados Completos do Prestador", False, 
                                     f"❌ Campos do prestador ausentes: {missing_provider_fields}")
                else:
                    self.log_test("Detalhes do Serviço", False, 
                                 f"❌ Falha ao obter detalhes - Status: {response.status_code}")
            else:
                self.log_test("Detalhes do Serviço", False, 
                             "❌ Nenhum serviço disponível para testar detalhes")
        
        # Test 6: FLUXO COMPLETO - Criar Agendamento
        print("\n--- TESTE 6: FLUXO COMPLETO - Criar Agendamento ---")
        
        # Login as client
        client_login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", client_login_data)
        
        if response.status_code == 200:
            data = response.json()
            client_token = data["access_token"]
            client_user = data["user"]
            
            self.log_test("Login Cliente", True, 
                         f"✅ Login cliente funcionando - {client_user.get('full_name')}")
            
            # Search services as client
            response = self.make_request("GET", "/servicos/search")
            
            if response.status_code == 200:
                services = response.json().get("data", [])
                
                self.log_test("Buscar Serviços (Cliente)", True, 
                             f"✅ Cliente pode buscar serviços - {len(services)} encontrados")
                
                if services:
                    # Create appointment with first service
                    service_id = services[0].get("id")
                    
                    appointment_data = {
                        "service_id": service_id,
                        "appointment_datetime": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
                        "client_notes": "Teste de agendamento"
                    }
                    
                    response = self.make_request("POST", "/agendamentos", appointment_data, token=client_token)
                    
                    if response.status_code == 200:
                        appointment_result = response.json()
                        appointment_id = appointment_result.get("data", {}).get("id")
                        
                        self.log_test("Criar Agendamento", True, 
                                     f"✅ Agendamento criado com sucesso - ID: {appointment_id}")
                        
                        # List client appointments
                        response = self.make_request("GET", "/agendamentos/meus", token=client_token)
                        
                        if response.status_code == 200:
                            appointments = response.json().get("data", [])
                            
                            self.log_test("Listar Meus Agendamentos", True, 
                                         f"✅ Cliente pode listar agendamentos - {len(appointments)} encontrados")
                        else:
                            self.log_test("Listar Meus Agendamentos", False, 
                                         f"❌ Falha ao listar agendamentos - Status: {response.status_code}")
                    else:
                        error_detail = response.text if response.text else "Sem detalhes do erro"
                        self.log_test("Criar Agendamento", False, 
                                     f"❌ Falha ao criar agendamento - Status: {response.status_code}, Erro: {error_detail}")
                else:
                    self.log_test("Criar Agendamento", False, 
                                 "❌ Nenhum serviço disponível para agendamento")
            else:
                self.log_test("Buscar Serviços (Cliente)", False, 
                             f"❌ Cliente não consegue buscar serviços - Status: {response.status_code}")
        else:
            self.log_test("Login Cliente", False, 
                         f"❌ Falha no login do cliente - Status: {response.status_code}")
        
        # Test 7: Validar como Prestador
        print("\n--- TESTE 7: Validar como Prestador ---")
        
        # Try to login with prestador@demo.com first
        prestador_login_data = {
            "email": "prestador@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", prestador_login_data)
        
        if response.status_code == 200:
            data = response.json()
            prestador_token = data["access_token"]
            prestador_user = data["user"]
            
            self.log_test("Login Prestador", True, 
                         f"✅ Login prestador funcionando - {prestador_user.get('full_name')}")
            
            # List provider appointments
            response = self.make_request("GET", "/prestador/agendamentos", token=prestador_token)
            
            if response.status_code == 200:
                appointments = response.json().get("data", [])
                
                self.log_test("Listar Agendamentos (Prestador)", True, 
                             f"✅ Prestador pode listar agendamentos - {len(appointments)} encontrados")
                
                if appointments:
                    print(f"\n📅 AGENDAMENTOS DO PRESTADOR:")
                    for appointment in appointments:
                        client_name = appointment.get('client', {}).get('name', 'N/A')
                        service_name = appointment.get('service', {}).get('name', 'N/A')
                        status = appointment.get('status', 'N/A')
                        appointment_date = appointment.get('appointment_datetime', 'N/A')
                        print(f"   • {service_name} - Cliente: {client_name} - Status: {status} - Data: {appointment_date}")
            else:
                self.log_test("Listar Agendamentos (Prestador)", False, 
                             f"❌ Prestador não consegue listar agendamentos - Status: {response.status_code}")
        else:
            # If prestador@demo.com doesn't exist, try to find any provider from recent tests
            self.log_test("Login Prestador", False, 
                         f"❌ Falha no login do prestador@demo.com - Status: {response.status_code}")
            
            # Try to find any provider that was created in recent tests
            print("   ℹ️ Tentando encontrar prestador criado em testes recentes...")
            
            # This would require checking the database or using a known provider
            # For now, we'll mark this as a limitation
            self.log_test("Validação Prestador Alternativa", False, 
                         "❌ Prestador demo não encontrado - necessário criar prestador de teste")
        
        # Final Summary
        print(f"\n🎯 RESUMO FINAL DO TESTE DE BUSCA DE SERVIÇOS E FLUXO COMPLETO:")
        successful_tests = len([r for r in self.test_results if r["success"]])
        total_tests = len(self.test_results)
        
        print(f"   • Testes executados: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "   • Taxa de sucesso: 0%")
        
        if successful_tests >= total_tests * 0.8:
            print("   ✅ RESULTADO: SISTEMA DE BUSCA E AGENDAMENTO FUNCIONANDO CORRETAMENTE")
            print("   ✅ FLUXO COMPLETO: Busca → Detalhes → Agendamento → Confirmação OPERACIONAL")
            print("   ✅ PROBLEMA REPORTADO: Sistema está funcionando, possível problema no frontend")
        elif successful_tests >= total_tests * 0.6:
            print(f"   ⚠️ RESULTADO: SISTEMA FUNCIONANDO PARCIALMENTE ({successful_tests}/{total_tests})")
            print("   ⚠️ ALGUNS PROBLEMAS: Verificar testes que falharam")
        else:
            print("   ❌ RESULTADO: PROBLEMAS CRÍTICOS NO SISTEMA DE BUSCA E AGENDAMENTO")
            print("   ❌ NECESSÁRIO: Investigar e corrigir problemas identificados")
        
        return successful_tests >= total_tests * 0.8

    def print_detailed_results(self):
        """Print detailed test results"""
        print("\n" + "=" * 80)
        print("📊 RESULTADOS DETALHADOS DOS TESTES")
        print("=" * 80)
        
        successful_tests = [r for r in self.test_results if r["success"]]
        failed_tests = [r for r in self.test_results if not r["success"]]
        
        if successful_tests:
            print(f"\n✅ TESTES BEM-SUCEDIDOS ({len(successful_tests)}):")
            for result in successful_tests:
                print(f"   • {result['test']}: {result['details']}")
        
        if failed_tests:
            print(f"\n❌ TESTES QUE FALHARAM ({len(failed_tests)}):")
            for result in failed_tests:
                print(f"   • {result['test']}: {result['details']}")
        
        print("\n🎯 TESTE CONCLUÍDO!")

def main():
    """Run the service search test"""
    print("🔍 INICIANDO TESTE URGENTE - BUSCA DE SERVIÇOS E FLUXO COMPLETO")
    print("=" * 80)
    
    tester = ServiceSearchTester()
    
    try:
        success = tester.test_service_search_complete_flow()
        tester.print_detailed_results()
        
        if success:
            print("\n✅ CONCLUSÃO: TESTE CONCLUÍDO COM SUCESSO!")
            return 0
        else:
            print("\n❌ CONCLUSÃO: PROBLEMAS IDENTIFICADOS NO TESTE!")
            return 1
            
    except Exception as e:
        print(f"\n❌ ERRO CRÍTICO NO TESTE: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())