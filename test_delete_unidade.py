#!/usr/bin/env python3
"""
Teste específico para DELETE de unidade Labelview
"""

import requests
import json
import time
import uuid
import base64
import io
from datetime import datetime, timezone

class DeleteUnidadeTest:
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
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_delete_unidade_specific(self):
        """🎯 TESTE ESPECÍFICO DE DELETE DE UNIDADE"""
        print("\n🎯 TESTE ESPECÍFICO DE DELETE DE UNIDADE")
        print("=" * 80)
        print("CONTEXTO:")
        print("Usuário reporta que após deploy, não consegue deletar unidades criadas.")
        print("Endpoint DELETE /api/labelview/unidades/{unidade_id} foi criado mas não funciona.")
        print("")
        print("TESTE NECESSÁRIO:")
        print("1. Login com master (protecao@agitomil.com / demo123)")
        print("2. Criar uma unidade de teste via POST")
        print("3. Capturar o ID da unidade criada")
        print("4. Tentar deletar via DELETE /api/labelview/unidades/{unidade_id}")
        print("5. Verificar se retorna success=true")
        print("6. Confirmar que unidade sumiu do GET /api/labelview/unidades")
        print("")
        print("IMPORTANTE:")
        print("- Capturar resposta completa do DELETE")
        print("- Se der erro, mostrar status code e mensagem")
        print("- Verificar se endpoint está registrado corretamente")
        print("- Testar se headers de autorização estão corretos")
        print("=" * 80)
        
        # Variables to store test data
        master_token = None
        unit_id = None
        unit_email = None
        
        # PASSO 1: Login com master (protecao@agitomil.com / demo123)
        print("\n=== PASSO 1: Login Master Labelview ===")
        
        master_login_data = {
            "email": "protecao@agitomil.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", master_login_data)
        
        if response.status_code == 200:
            data = response.json()
            master_token = data.get("access_token")
            master_user = data.get("user", {})
            
            if master_token and master_user.get("is_labelview_master", False):
                self.log_test("1. Login Master", True, 
                             f"✅ Login Master funcionando - Token JWT válido, is_labelview_master=true")
                print(f"   📧 Email: {master_user.get('email')}")
                print(f"   👤 Nome: {master_user.get('full_name')}")
            else:
                self.log_test("1. Login Master", False, 
                             "❌ Login Master falhou ou não é labelview_master")
                return False
        else:
            self.log_test("1. Login Master", False, 
                         f"❌ Login Master falhou - Status: {response.status_code}")
            return False
        
        # PASSO 2: Criar uma unidade de teste via POST
        print("\n=== PASSO 2: Criar Unidade de Teste ===")
        
        timestamp = int(time.time())
        test_email = f"unidade.delete.teste.{timestamp}@teste.com"
        test_cnpj = f"33.444.555/0001-{timestamp % 100:02d}"
        
        # Create minimal PNG for logo
        png_data = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=='
        )
        
        files = {
            'logo': ('test_logo.png', io.BytesIO(png_data), 'image/png')
        }
        
        form_data = {
            'nome_fantasia': 'Unidade Delete Teste',
            'razao_social': 'Unidade Delete LTDA',
            'cnpj': test_cnpj,
            'telefone': '(11) 99999-9999',
            'whatsapp': '(11) 99999-9999',
            'email': test_email,
            'password': 'SenhaProvisoria2024!',
            'responsavel_nome': 'João Delete Teste',
            'responsavel_cpf': '123.456.789-00',
            'responsavel_email': 'joao.delete@teste.com',
            'responsavel_whatsapp': '(11) 99999-9999',
            'pix_key': test_cnpj,
            'pix_key_type': 'cnpj',
            'taxa_adesao': '100.00',
            'vencimento_inicio': '1',
            'vencimento_fim': '15',
            'cep': '01310-100',
            'address': 'Rua Delete Teste, 123',
            'number': '123',
            'complement': '',
            'neighborhood': 'Centro',
            'city': 'São Paulo',
            'state': 'SP',
            'cor_primaria': '#1a59ad',
            'cor_secundaria': '#2fa31c'
        }
        
        headers = {
            'Authorization': f'Bearer {master_token}'
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/labelview/unidades",
                data=form_data,
                files=files,
                headers=headers
            )
            
            if response.status_code == 200:
                unit_data = response.json()
                success = unit_data.get("success", False)
                unit_id = unit_data.get("unidade_id")
                credentials = unit_data.get("credentials", {})
                unit_email = credentials.get("email")
                
                if success and unit_id:
                    self.log_test("2. Criar Unidade", True, 
                                 f"✅ Unidade criada com sucesso - ID: {unit_id}")
                    print(f"   🆔 ID da Unidade: {unit_id}")
                    print(f"   📧 Email: {unit_email}")
                else:
                    self.log_test("2. Criar Unidade", False, 
                                 f"❌ Falha ao criar unidade - success: {success}, unit_id: {unit_id}")
                    return False
            else:
                self.log_test("2. Criar Unidade", False, 
                             f"❌ Falha ao criar unidade - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Erro: {error_data}")
                except:
                    print(f"❌ Erro sem detalhes - Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("2. Criar Unidade", False, 
                         f"❌ Erro ao criar unidade: {str(e)}")
            return False
        
        # PASSO 3: Capturar o ID da unidade criada (já feito no passo 2)
        print("\n=== PASSO 3: ID da Unidade Capturado ===")
        
        if unit_id:
            self.log_test("3. Capturar ID", True, 
                         f"✅ ID da unidade capturado: {unit_id}")
        else:
            self.log_test("3. Capturar ID", False, 
                         "❌ ID da unidade não foi capturado")
            return False
        
        # PASSO 4: Tentar deletar via DELETE /api/labelview/unidades/{unidade_id}
        print("\n=== PASSO 4: Deletar Unidade via DELETE ===")
        
        delete_endpoint = f"/labelview/unidades/{unit_id}"
        print(f"🔍 Endpoint DELETE: {self.base_url}{delete_endpoint}")
        print(f"🔑 Authorization: Bearer {master_token[:20]}...")
        
        try:
            response = self.make_request("DELETE", delete_endpoint, token=master_token)
            
            print(f"📊 Status Code: {response.status_code}")
            
            # Capturar resposta completa
            try:
                response_data = response.json()
                print(f"📋 Resposta Completa: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
            except:
                response_text = response.text
                print(f"📋 Resposta (texto): {response_text}")
                response_data = {"raw_response": response_text}
            
            if response.status_code == 200:
                success = response_data.get("success", False) if isinstance(response_data, dict) else False
                
                if success:
                    self.log_test("4. DELETE Unidade", True, 
                                 f"✅ DELETE funcionando - Status: 200, success: true")
                else:
                    self.log_test("4. DELETE Unidade", False, 
                                 f"❌ DELETE retornou 200 mas success: {success}")
                    
            elif response.status_code == 404:
                self.log_test("4. DELETE Unidade", False, 
                             f"❌ Endpoint não encontrado - Status: 404")
                print("❌ PROBLEMA: Endpoint DELETE não está registrado ou rota incorreta")
                return False
                
            elif response.status_code == 405:
                self.log_test("4. DELETE Unidade", False, 
                             f"❌ Método não permitido - Status: 405")
                print("❌ PROBLEMA: Endpoint existe mas método DELETE não implementado")
                return False
                
            elif response.status_code == 401:
                self.log_test("4. DELETE Unidade", False, 
                             f"❌ Não autorizado - Status: 401")
                print("❌ PROBLEMA: Headers de autorização incorretos ou token inválido")
                return False
                
            elif response.status_code == 403:
                self.log_test("4. DELETE Unidade", False, 
                             f"❌ Acesso negado - Status: 403")
                print("❌ PROBLEMA: Token válido mas sem permissão para deletar")
                return False
                
            else:
                self.log_test("4. DELETE Unidade", False, 
                             f"❌ Status inesperado: {response.status_code}")
                print(f"❌ PROBLEMA: Status code inesperado - {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("4. DELETE Unidade", False, 
                         f"❌ Erro na requisição DELETE: {str(e)}")
            return False
        
        # PASSO 5: Verificar se retorna success=true (já validado no passo 4)
        print("\n=== PASSO 5: Validar success=true ===")
        
        if response.status_code == 200 and isinstance(response_data, dict) and response_data.get("success", False):
            self.log_test("5. Validar Success", True, 
                         "✅ Resposta contém success=true")
        else:
            self.log_test("5. Validar Success", False, 
                         f"❌ Resposta não contém success=true - Status: {response.status_code}")
            return False
        
        # PASSO 6: Confirmar que unidade sumiu do GET /api/labelview/unidades
        print("\n=== PASSO 6: Confirmar Unidade Foi Removida ===")
        
        try:
            response = self.make_request("GET", "/labelview/unidades", token=master_token)
            
            if response.status_code == 200:
                units_data = response.json()
                
                # Procurar pela unidade deletada na lista
                unit_found = False
                if isinstance(units_data, list):
                    for unit in units_data:
                        if unit.get("id") == unit_id or unit.get("email") == unit_email:
                            unit_found = True
                            break
                elif isinstance(units_data, dict) and "unidades" in units_data:
                    for unit in units_data["unidades"]:
                        if unit.get("id") == unit_id or unit.get("email") == unit_email:
                            unit_found = True
                            break
                
                if not unit_found:
                    self.log_test("6. Confirmar Remoção", True, 
                                 f"✅ Unidade removida com sucesso - não encontrada na listagem")
                else:
                    self.log_test("6. Confirmar Remoção", False, 
                                 f"❌ Unidade ainda existe na listagem após DELETE")
                    return False
                    
            else:
                self.log_test("6. Confirmar Remoção", False, 
                             f"❌ Erro ao listar unidades - Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("6. Confirmar Remoção", False, 
                         f"❌ Erro ao verificar remoção: {str(e)}")
            return False
        
        # RESUMO FINAL
        print(f"\n🎯 RESUMO DO TESTE DELETE DE UNIDADE:")
        
        delete_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in ["Login Master", "Criar Unidade", "Capturar ID", "DELETE Unidade", "Validar Success", "Confirmar Remoção"])]
        total_tests = len(delete_tests)
        successful_tests = len([r for r in delete_tests if r["success"]])
        
        print(f"   • Total de testes executados: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "   • Taxa de sucesso: 0%")
        
        if successful_tests == total_tests and total_tests >= 6:
            print("\n✅ RESULTADO: DELETE DE UNIDADE FUNCIONANDO 100%!")
            print("   ✅ Endpoint DELETE /api/labelview/unidades/{id} está funcionando")
            print("   ✅ Retorna success=true quando deleta")
            print("   ✅ Unidade é removida do banco de dados")
            print("   ✅ Headers de autorização funcionando corretamente")
            print("   ✅ Problema reportado pelo usuário foi RESOLVIDO")
            return True
        else:
            print("\n❌ RESULTADO: PROBLEMAS CRÍTICOS NO DELETE DE UNIDADE!")
            print("   ❌ Endpoint DELETE não está funcionando corretamente")
            
            # Mostrar problemas específicos
            failed_tests = [r for r in self.test_results if not r["success"]]
            if failed_tests:
                print("\n❌ PROBLEMAS ESPECÍFICOS:")
                for test in failed_tests:
                    print(f"   • {test['test']}: {test['details']}")
            
            print("\n❌ CORREÇÃO NECESSÁRIA antes do uso em produção")
            return False

if __name__ == "__main__":
    tester = DeleteUnidadeTest()
    success = tester.test_delete_unidade_specific()
    
    print("\n" + "="*50)
    print("RESULTADOS DETALHADOS:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['details']}")
    print("="*50)
    
    if success:
        print("\n✅ TESTE CONCLUÍDO COM SUCESSO!")
    else:
        print("\n❌ TESTE FALHOU - CORREÇÕES NECESSÁRIAS")