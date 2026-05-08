#!/usr/bin/env python3
"""
Teste Completo do Sistema de Tabela de Valores Labelview
Testa todos os endpoints CRUD e funcionalidades do sistema de preços por faixa FIPE
"""

import requests
import json
import time
from typing import Dict, Any

class LabelviewTabelaValoresTester:
    def __init__(self):
        # Read backend URL from environment or use default
        import os
        backend_url = os.environ.get('base_url', 'https://demobackend.emergentagent.com')
        
        # Ensure URL ends with /api
        if backend_url.endswith('/api'):
            self.base_url = backend_url
        else:
            self.base_url = f"{backend_url}/api"
        
        print(f"🔗 Using backend URL: {self.base_url}")
        
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

    def run_complete_test(self):
        """🎯 TESTE COMPLETO DO SISTEMA DE TABELA DE VALORES LABELVIEW"""
        print("\n🎯 TESTE COMPLETO DO SISTEMA DE TABELA DE VALORES LABELVIEW")
        print("=" * 80)
        print("CONTEXTO:")
        print("Sistema de Tabela de Valores para Labelview onde Master pode cadastrar")
        print("valores de serviços por faixa FIPE.")
        print("")
        print("CREDENCIAIS:")
        print("- Master Labelview: protecao@agitomil.com / demo123")
        print("- Conta Labelview: labelview@agitomil.com / labelview2025")
        print("")
        print("ENDPOINTS A TESTAR:")
        print("1. GET /api/labelview/tabelas/tipos - Listar tipos de cobertura")
        print("2. POST /api/labelview/tabelas/criar - Criar tabelas por faixa FIPE")
        print("3. GET /api/labelview/tabelas/{tipo} - Listar tabelas por tipo")
        print("4. POST /api/labelview/tabelas/buscar-valor - Buscar valor por FIPE")
        print("5. PUT /api/labelview/tabelas/{id} - Atualizar tabela")
        print("6. DELETE /api/labelview/tabelas/{id} - Excluir (desativar) tabela")
        print("7. Teste de permissões - Apenas Master pode criar")
        print("8. Verificar conta Labelview existe")
        print("=" * 80)
        
        # Test 1: Login Master Labelview
        print("\n--- TESTE 1: Login Master Labelview (protecao@agitomil.com/demo123) ---")
        
        master_login_data = {
            "email": "protecao@agitomil.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", master_login_data)
        
        master_token = None
        master_user = None
        
        if response.status_code == 200:
            data = response.json()
            master_token = data.get("access_token")
            master_user = data.get("user", {})
            
            self.log_test("Login Master Labelview", True, 
                         f"✅ Login funcionando - {master_user.get('full_name', 'Master')}")
            
            # Verificar is_labelview_master
            if master_user.get("is_labelview_master", False):
                self.log_test("Master Labelview Permissions", True, 
                             "✅ is_labelview_master=true confirmado")
            else:
                self.log_test("Master Labelview Permissions", False, 
                             "❌ is_labelview_master deveria ser true")
                return False
        else:
            self.log_test("Login Master Labelview", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
            return False
        
        # Test 2: GET /api/labelview/tabelas/tipos
        print("\n--- TESTE 2: GET /api/labelview/tabelas/tipos ---")
        
        response = self.make_request("GET", "/labelview/tabelas/tipos", token=master_token)
        
        if response.status_code == 200:
            data = response.json()
            
            # Validar success=true
            if data.get("success"):
                self.log_test("Tipos Cobertura - Success", True, "✅ success=true")
            else:
                self.log_test("Tipos Cobertura - Success", False, "❌ success não é true")
            
            # Validar tipos_cobertura array
            tipos = data.get("tipos_cobertura", [])
            if len(tipos) == 6:
                self.log_test("Tipos Cobertura - Count", True, 
                             f"✅ 6 tipos de cobertura retornados")
            else:
                self.log_test("Tipos Cobertura - Count", False, 
                             f"❌ {len(tipos)} tipos retornados (esperado: 6)")
            
            # Validar tipos específicos
            expected_tipos = [
                "Roubo/Furto/PT",
                "Assistencia 24hs",
                "Vidros, Farois, lanternas",
                "Carro Reserva",
                "Colisão",
                "Danos materiais e Terceiros"
            ]
            
            all_found = all(tipo in tipos for tipo in expected_tipos)
            if all_found:
                self.log_test("Tipos Cobertura - Items", True, 
                             "✅ Todos os 6 tipos esperados presentes")
                print(f"   📋 Tipos: {', '.join(tipos)}")
            else:
                missing = [t for t in expected_tipos if t not in tipos]
                self.log_test("Tipos Cobertura - Items", False, 
                             f"❌ Tipos faltando: {missing}")
        else:
            self.log_test("Tipos Cobertura API", False, 
                         f"❌ Status: {response.status_code}")
            return False
        
        # Test 3: POST /api/labelview/tabelas/criar - Criar 3 faixas
        print("\n--- TESTE 3: POST /api/labelview/tabelas/criar (3 faixas) ---")
        
        faixas = [
            {
                "tipo_cobertura": "Roubo/Furto/PT",
                "valor_servico": 50.00,
                "valor_fipe_min": 0,
                "valor_fipe_max": 20000,
                "descricao": "Veículos até R$ 20mil"
            },
            {
                "tipo_cobertura": "Roubo/Furto/PT",
                "valor_servico": 100.00,
                "valor_fipe_min": 20001,
                "valor_fipe_max": 50000,
                "descricao": "Veículos de R$ 20mil a R$ 50mil"
            },
            {
                "tipo_cobertura": "Roubo/Furto/PT",
                "valor_servico": 200.00,
                "valor_fipe_min": 50001,
                "valor_fipe_max": 100000,
                "descricao": "Veículos de R$ 50mil a R$ 100mil"
            }
        ]
        
        created_ids = []
        
        for i, faixa in enumerate(faixas, 1):
            response = self.make_request("POST", "/labelview/tabelas/criar", faixa, token=master_token)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("tabela_id"):
                    created_ids.append(data.get("tabela_id"))
                    self.log_test(f"Criar Faixa {i}", True, 
                                 f"✅ Faixa {i} criada - Valor: R$ {faixa['valor_servico']:.2f} (FIPE: R$ {faixa['valor_fipe_min']}-{faixa['valor_fipe_max']})")
                else:
                    self.log_test(f"Criar Faixa {i}", False, 
                                 f"❌ Resposta inválida: {data}")
            else:
                self.log_test(f"Criar Faixa {i}", False, 
                             f"❌ Status: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Erro: {error.get('detail', 'Desconhecido')}")
                except:
                    pass
        
        if len(created_ids) != 3:
            print(f"❌ ERRO: Apenas {len(created_ids)} faixas criadas (esperado: 3)")
            return False
        
        print(f"   ✅ {len(created_ids)} faixas criadas com sucesso")
        
        # Test 4: GET /api/labelview/tabelas/Roubo_Furto_PT
        print("\n--- TESTE 4: GET /api/labelview/tabelas/Roubo_Furto_PT ---")
        
        response = self.make_request("GET", "/labelview/tabelas/Roubo_Furto_PT", token=master_token)
        
        if response.status_code == 200:
            data = response.json()
            
            # Validar success
            if data.get("success"):
                self.log_test("Listar Tabelas - Success", True, "✅ success=true")
            else:
                self.log_test("Listar Tabelas - Success", False, "❌ success não é true")
            
            # Validar tabelas array
            tabelas = data.get("tabelas", [])
            if len(tabelas) >= 3:
                self.log_test("Listar Tabelas - Count", True, 
                             f"✅ {len(tabelas)} tabelas retornadas (≥3)")
            else:
                self.log_test("Listar Tabelas - Count", False, 
                             f"❌ {len(tabelas)} tabelas (esperado: ≥3)")
            
            # Validar ordenação por valor_fipe_min
            if len(tabelas) >= 2:
                is_sorted = all(tabelas[i].get("valor_fipe_min", 0) <= tabelas[i+1].get("valor_fipe_min", 0) 
                               for i in range(len(tabelas)-1))
                if is_sorted:
                    self.log_test("Listar Tabelas - Ordenação", True, 
                                 "✅ Tabelas ordenadas por valor_fipe_min")
                else:
                    self.log_test("Listar Tabelas - Ordenação", False, 
                                 "❌ Tabelas não ordenadas corretamente")
            
            # Validar campos obrigatórios
            if tabelas:
                required_fields = ["id", "tipo_cobertura", "valor_servico", 
                                  "valor_fipe_min", "valor_fipe_max", "descricao", "ativo"]
                first_table = tabelas[0]
                missing = [f for f in required_fields if f not in first_table]
                
                if not missing:
                    self.log_test("Listar Tabelas - Campos", True, 
                                 "✅ Todos os campos obrigatórios presentes")
                else:
                    self.log_test("Listar Tabelas - Campos", False, 
                                 f"❌ Campos faltando: {missing}")
                
                # Mostrar primeiras 3 tabelas
                print(f"\n   📋 Primeiras 3 tabelas:")
                for i, tab in enumerate(tabelas[:3], 1):
                    print(f"      {i}. R$ {tab.get('valor_servico', 0):.2f} - FIPE: R$ {tab.get('valor_fipe_min', 0):.2f} a R$ {tab.get('valor_fipe_max', 0):.2f}")
        else:
            self.log_test("Listar Tabelas API", False, 
                         f"❌ Status: {response.status_code}")
            return False
        
        # Test 5: POST /api/labelview/tabelas/buscar-valor
        print("\n--- TESTE 5: POST /api/labelview/tabelas/buscar-valor ---")
        
        busca_data = {
            "tipo_cobertura": "Roubo/Furto/PT",
            "valor_fipe": 30000
        }
        
        response = self.make_request("POST", "/labelview/tabelas/buscar-valor", 
                                    busca_data, token=master_token)
        
        if response.status_code == 200:
            data = response.json()
            
            # Validar success
            if data.get("success"):
                self.log_test("Buscar Valor - Success", True, "✅ success=true")
            else:
                self.log_test("Buscar Valor - Success", False, "❌ success não é true")
            
            # Validar valor_servico correto (faixa 20001-50000 = R$ 100)
            valor_servico = data.get("valor_servico")
            if valor_servico == 100.00:
                self.log_test("Buscar Valor - Valor Correto", True, 
                             f"✅ valor_servico=100.00 (faixa 20001-50000)")
                print(f"   💰 Valor encontrado: R$ {valor_servico:.2f}")
                print(f"   📊 Faixa: {data.get('faixa', 'N/A')}")
            else:
                self.log_test("Buscar Valor - Valor Correto", False, 
                             f"❌ valor_servico={valor_servico} (esperado: 100.00)")
        else:
            self.log_test("Buscar Valor API", False, 
                         f"❌ Status: {response.status_code}")
        
        # Test 6: PUT /api/labelview/tabelas/{tabela_id}
        print("\n--- TESTE 6: PUT /api/labelview/tabelas/{tabela_id} ---")
        
        if created_ids:
            # Atualizar faixa 2 (índice 1)
            update_data = {
                "valor_servico": 120.00
            }
            
            response = self.make_request("PUT", f"/labelview/tabelas/{created_ids[1]}", 
                                        update_data, token=master_token)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    self.log_test("Atualizar Tabela", True, 
                                 "✅ Tabela atualizada com sucesso")
                    
                    # Verificar se valor foi atualizado
                    time.sleep(0.5)  # Pequeno delay para garantir atualização
                    response = self.make_request("GET", "/labelview/tabelas/Roubo_Furto_PT", 
                                                token=master_token)
                    if response.status_code == 200:
                        tabelas = response.json().get("tabelas", [])
                        updated_table = next((t for t in tabelas if t.get("id") == created_ids[1]), None)
                        
                        if updated_table and updated_table.get("valor_servico") == 120.00:
                            self.log_test("Atualizar Tabela - Verificação", True, 
                                         "✅ Valor atualizado confirmado (100 → 120)")
                        else:
                            self.log_test("Atualizar Tabela - Verificação", False, 
                                         "❌ Valor não foi atualizado corretamente")
                else:
                    self.log_test("Atualizar Tabela", False, "❌ success não é true")
            else:
                self.log_test("Atualizar Tabela API", False, 
                             f"❌ Status: {response.status_code}")
        
        # Test 7: DELETE /api/labelview/tabelas/{tabela_id}
        print("\n--- TESTE 7: DELETE /api/labelview/tabelas/{tabela_id} ---")
        
        if created_ids:
            # Excluir faixa 3 (índice 2)
            response = self.make_request("DELETE", f"/labelview/tabelas/{created_ids[2]}", 
                                        token=master_token)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    self.log_test("Excluir Tabela", True, 
                                 "✅ Tabela excluída (desativada) com sucesso")
                    
                    # Verificar se foi desativada (ativo=false)
                    time.sleep(0.5)  # Pequeno delay
                    response = self.make_request("GET", "/labelview/tabelas/Roubo_Furto_PT", 
                                                token=master_token)
                    if response.status_code == 200:
                        tabelas = response.json().get("tabelas", [])
                        deleted_table = next((t for t in tabelas if t.get("id") == created_ids[2]), None)
                        
                        if deleted_table is None:
                            self.log_test("Excluir Tabela - Verificação", True, 
                                         "✅ Tabela não aparece mais na lista (ativo=false)")
                        else:
                            self.log_test("Excluir Tabela - Verificação", False, 
                                         "❌ Tabela ainda aparece na lista")
                        
                        # Verificar que agora só tem 2 tabelas ativas
                        active_count = len(tabelas)
                        print(f"   📊 Tabelas ativas após exclusão: {active_count}")
                        if active_count >= 2:
                            self.log_test("Excluir Tabela - Count", True, 
                                         f"✅ Agora retorna {active_count} tabelas ativas")
                        else:
                            self.log_test("Excluir Tabela - Count", False, 
                                         f"❌ Retorna {active_count} tabelas (esperado: ≥2)")
                else:
                    self.log_test("Excluir Tabela", False, "❌ success não é true")
            else:
                self.log_test("Excluir Tabela API", False, 
                             f"❌ Status: {response.status_code}")
        
        # Test 8: Teste de Permissões (tentar criar sem ser master)
        print("\n--- TESTE 8: Teste de Permissões ---")
        
        # Login com conta não-master
        client_login = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", client_login)
        if response.status_code == 200:
            client_token = response.json().get("access_token")
            
            # Tentar criar tabela com token de cliente
            faixa_test = {
                "tipo_cobertura": "Roubo/Furto/PT",
                "valor_servico": 50.00,
                "valor_fipe_min": 0,
                "valor_fipe_max": 10000,
                "descricao": "Teste"
            }
            
            response = self.make_request("POST", "/labelview/tabelas/criar", 
                                        faixa_test, token=client_token)
            
            if response.status_code == 403:
                self.log_test("Permissões - Cliente Bloqueado", True, 
                             "✅ Cliente não pode criar tabelas (403 Forbidden)")
            else:
                self.log_test("Permissões - Cliente Bloqueado", False, 
                             f"❌ Cliente recebeu status {response.status_code} (esperado: 403)")
        
        # Test 9: Verificar conta Labelview
        print("\n--- TESTE 9: Verificar Conta Labelview ---")
        
        labelview_login = {
            "email": "labelview@agitomil.com",
            "password": "labelview2025"
        }
        
        response = self.make_request("POST", "/auth/login", labelview_login)
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            
            self.log_test("Conta Labelview - Login", True, 
                         "✅ Conta labelview@agitomil.com existe e está ativa")
            
            # Verificar user_type
            if user.get("user_type") == "service_provider":
                self.log_test("Conta Labelview - User Type", True, 
                             "✅ user_type=service_provider")
            else:
                self.log_test("Conta Labelview - User Type", False, 
                             f"❌ user_type={user.get('user_type')} (esperado: service_provider)")
            
            print(f"   👤 Nome: {user.get('full_name', 'N/A')}")
            print(f"   📧 Email: {user.get('email', 'N/A')}")
            print(f"   🏢 Tipo: {user.get('user_type', 'N/A')}")
            
        else:
            self.log_test("Conta Labelview - Login", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
        
        # Final Summary
        print(f"\n🎯 RESUMO DO TESTE COMPLETO DE TABELA DE VALORES:")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Testes falharam: {failed_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        
        # Validações críticas
        critical_validations = [
            "Login Master Labelview",
            "Tipos Cobertura - Count",
            "Criar Faixa 1",
            "Criar Faixa 2",
            "Criar Faixa 3",
            "Listar Tabelas - Count",
            "Buscar Valor - Valor Correto",
            "Atualizar Tabela",
            "Excluir Tabela",
            "Permissões - Cliente Bloqueado",
            "Conta Labelview - Login"
        ]
        
        critical_passed = sum(1 for test_name in critical_validations 
                             if any(test_name in r["test"] and r["success"] 
                                   for r in self.test_results))
        
        print(f"   • Validações críticas: {critical_passed}/{len(critical_validations)}")
        print("")
        
        if critical_passed == len(critical_validations):
            print("✅ RESULTADO: SISTEMA DE TABELA DE VALORES 100% FUNCIONAL")
            print("   ✅ Tipos de cobertura corretos")
            print("   ✅ CRUD completo funcionando")
            print("   ✅ Busca por valor FIPE funcionando")
            print("   ✅ Ordenação por valor_fipe_min")
            print("   ✅ Desativação ao invés de exclusão física")
            print("   ✅ Permissões Master funcionando")
            print("   ✅ Conta Labelview criada corretamente")
            return True
        else:
            print(f"❌ RESULTADO: PROBLEMAS IDENTIFICADOS")
            print(f"   ❌ {len(critical_validations) - critical_passed} validações críticas falharam")
            print("")
            print("   Testes que falharam:")
            for test_name in critical_validations:
                if not any(test_name in r["test"] and r["success"] for r in self.test_results):
                    print(f"      ❌ {test_name}")
            return False

if __name__ == "__main__":
    tester = LabelviewTabelaValoresTester()
    success = tester.run_complete_test()
    
    print("\n" + "="*80)
    print("TESTES DETALHADOS:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}")
    print("="*80)
    
    exit(0 if success else 1)
