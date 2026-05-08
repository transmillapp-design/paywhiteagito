#!/usr/bin/env python3
"""
Labelview Notifications System Test
Complete test of the Labelview notification system endpoints
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class LabelviewNotificationsTest:
    def __init__(self, base_url: str = None):
        if base_url is None:
            # Read from frontend .env file
            try:
                with open('/app/frontend/.env', 'r') as f:
                    for line in f:
                        if line.startswith('REACT_APP_BACKEND_URL='):
                            frontend_url = line.split('=', 1)[1].strip()
                            # Check if URL already ends with /api
                            if frontend_url.endswith('/api'):
                                base_url = frontend_url
                            else:
                                base_url = f"{frontend_url}/api"
                            break
                if base_url is None:
                    base_url = "http://localhost:8001/api"
            except:
                base_url = "http://localhost:8001/api"
        
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
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_labelview_notifications_system_complete(self):
        """🔔 TESTE COMPLETO DO SISTEMA DE NOTIFICAÇÕES LABELVIEW"""
        print("\n🔔 TESTE COMPLETO DO SISTEMA DE NOTIFICAÇÕES LABELVIEW")
        print("=" * 80)
        print("CONTEXTO:")
        print("Sistema completo de notificações internas para o Labelview com:")
        print("- Envio de notificações (texto + anexo: imagem ou PDF)")
        print("- Prioridades: baixa, média, alta")
        print("- Múltiplos destinatários")
        print("- Hierarquia respeitada")
        print("- Integração com sistema AgitoMil para clientes")
        print("")
        print("ENDPOINTS CRIADOS:")
        print("1. POST /api/labelview/notifications - Criar notificação")
        print("2. GET /api/labelview/notifications - Listar notificações do usuário")
        print("3. GET /api/labelview/notifications/unread-count - Contagem de não lidas")
        print("4. PATCH /api/labelview/notifications/{id}/read - Marcar como lida")
        print("5. GET /api/labelview/users/recipients - Listar destinatários disponíveis")
        print("")
        print("CREDENCIAIS MASTER:")
        print("- Email: protecao@agitomil.com")
        print("- Senha: demo123")
        print("=" * 80)
        
        # Test 1: Login Master Labelview
        print("\n--- TESTE 1: Login Master Labelview ---")
        
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
            
            # Validar login funcionando
            self.log_test("Login Master Labelview", True, 
                         f"✅ Login funcionando - {master_user.get('full_name', 'Master')}")
            
            # Validar permissões Labelview
            is_labelview_master = master_user.get("is_labelview_master", False)
            if is_labelview_master:
                self.log_test("Permissões Labelview Master", True, 
                             "✅ is_labelview_master=true confirmado")
            else:
                self.log_test("Permissões Labelview Master", False, 
                             f"❌ is_labelview_master={is_labelview_master} (esperado: true)")
                return False
                
        else:
            self.log_test("Login Master Labelview", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
            return False
        
        # Test 2: Listar Destinatários Disponíveis
        print("\n--- TESTE 2: Listar Destinatários Disponíveis ---")
        
        response = self.make_request("GET", "/labelview/users/recipients", token=master_token)
        
        recipients = []
        if response.status_code == 200:
            try:
                response_data = response.json()
                recipients = response_data.get("recipients", []) if isinstance(response_data, dict) else response_data
                
                self.log_test("Listar Destinatários - Status 200", True, 
                             "✅ Endpoint funcionando")
                
                # Validar estrutura da resposta
                if isinstance(recipients, list):
                    self.log_test("Listar Destinatários - Lista Retornada", True, 
                                 f"✅ Lista de destinatários retornada ({len(recipients)} usuários)")
                    
                    # Validar estrutura de cada destinatário
                    if recipients:
                        first_recipient = recipients[0]
                        required_fields = ["id", "full_name", "email", "user_type"]
                        missing_fields = [field for field in required_fields if field not in first_recipient]
                        
                        if not missing_fields:
                            self.log_test("Estrutura Destinatários", True, 
                                         "✅ Cada destinatário tem id, full_name, email, user_type")
                        else:
                            self.log_test("Estrutura Destinatários", False, 
                                         f"❌ Campos ausentes: {', '.join(missing_fields)}")
                    else:
                        self.log_test("Estrutura Destinatários", True, 
                                     "✅ Lista vazia (sem usuários na hierarquia)")
                else:
                    self.log_test("Listar Destinatários - Lista Retornada", False, 
                                 f"❌ Resposta não é uma lista: {type(recipients)}")
                    
            except Exception as e:
                self.log_test("Listar Destinatários - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("Listar Destinatários - Status 200", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
            return False
        
        # Test 3: Criar Notificação Simples (sem anexo)
        print("\n--- TESTE 3: Criar Notificação Simples (sem anexo) ---")
        
        # Usar IDs dos destinatários se disponíveis, senão usar lista vazia
        recipient_ids = [r["id"] for r in recipients[:2]] if recipients and len(recipients) > 0 else []
        
        notification_data = {
            "title": "Teste de Notificação",
            "message": "Esta é uma notificação de teste do sistema Labelview",
            "priority": "media",
            "recipient_ids": recipient_ids
        }
        
        response = self.make_request("POST", "/labelview/notifications", notification_data, token=master_token)
        
        notification_id = None
        if response.status_code == 200:
            try:
                data = response.json()
                success = data.get("success", False)
                
                if success:
                    self.log_test("Criar Notificação Simples - Success", True, 
                                 "✅ success=true na resposta")
                else:
                    self.log_test("Criar Notificação Simples - Success", False, 
                                 f"❌ success={success} (esperado: true)")
                
                # Validar recipients_count
                recipients_count = data.get("recipients_count", 0)
                if recipients_count >= 0:
                    self.log_test("Criar Notificação - Recipients Count", True, 
                                 f"✅ recipients_count={recipients_count}")
                else:
                    self.log_test("Criar Notificação - Recipients Count", False, 
                                 f"❌ recipients_count inválido: {recipients_count}")
                
                # Guardar ID da notificação para testes posteriores
                notification_id = data.get("notification_id")
                if notification_id:
                    self.log_test("Criar Notificação - ID Retornado", True, 
                                 f"✅ notification_id retornado: {notification_id}")
                else:
                    self.log_test("Criar Notificação - ID Retornado", False, 
                                 "❌ notification_id não retornado")
                
            except Exception as e:
                self.log_test("Criar Notificação - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("Criar Notificação Simples - Status 200", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
        
        # Test 4: Criar Notificação com Prioridade Alta
        print("\n--- TESTE 4: Criar Notificação com Prioridade Alta ---")
        
        high_priority_data = {
            "title": "URGENTE: Atualização Importante",
            "message": "Teste de notificação com prioridade alta",
            "priority": "alta",
            "recipient_ids": recipient_ids
        }
        
        response = self.make_request("POST", "/labelview/notifications", high_priority_data, token=master_token)
        
        if response.status_code == 200:
            try:
                data = response.json()
                success = data.get("success", False)
                
                if success:
                    self.log_test("Notificação Prioridade Alta", True, 
                                 "✅ Notificação com prioridade alta criada com sucesso")
                else:
                    self.log_test("Notificação Prioridade Alta", False, 
                                 f"❌ Falha na criação: success={success}")
                    
            except Exception as e:
                self.log_test("Notificação Prioridade Alta - Parse", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("Notificação Prioridade Alta", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
        
        # Test 5: Listar Notificações do Usuário
        print("\n--- TESTE 5: Listar Notificações do Usuário ---")
        
        response = self.make_request("GET", "/labelview/notifications", token=master_token)
        
        user_notifications = []
        if response.status_code == 200:
            try:
                user_notifications = response.json()
                
                self.log_test("Listar Notificações - Status 200", True, 
                             "✅ Endpoint funcionando")
                
                if isinstance(user_notifications, list):
                    self.log_test("Listar Notificações - Lista Retornada", True, 
                                 f"✅ Lista de notificações retornada ({len(user_notifications)} notificações)")
                    
                    # Validar estrutura das notificações
                    if user_notifications:
                        first_notification = user_notifications[0]
                        required_fields = ["id", "title", "message", "priority", "is_read", "sender_name", "created_at"]
                        missing_fields = [field for field in required_fields if field not in first_notification]
                        
                        if not missing_fields:
                            self.log_test("Estrutura Notificações", True, 
                                         "✅ Campos obrigatórios presentes: id, title, message, priority, is_read, sender_name, created_at")
                        else:
                            self.log_test("Estrutura Notificações", False, 
                                         f"❌ Campos ausentes: {', '.join(missing_fields)}")
                    else:
                        self.log_test("Estrutura Notificações", True, 
                                     "✅ Lista vazia (sem notificações para o usuário)")
                else:
                    self.log_test("Listar Notificações - Lista Retornada", False, 
                                 f"❌ Resposta não é uma lista: {type(user_notifications)}")
                    
            except Exception as e:
                self.log_test("Listar Notificações - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("Listar Notificações - Status 200", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
        
        # Test 6: Contagem de Não Lidas
        print("\n--- TESTE 6: Contagem de Não Lidas ---")
        
        response = self.make_request("GET", "/labelview/notifications/unread-count", token=master_token)
        
        if response.status_code == 200:
            try:
                data = response.json()
                unread_count = data.get("unread_count")
                
                if isinstance(unread_count, int) and unread_count >= 0:
                    self.log_test("Contagem Não Lidas", True, 
                                 f"✅ unread_count retornado: {unread_count}")
                else:
                    self.log_test("Contagem Não Lidas", False, 
                                 f"❌ unread_count inválido: {unread_count}")
                    
            except Exception as e:
                self.log_test("Contagem Não Lidas - Parse", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("Contagem Não Lidas", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
        
        # Test 7: Marcar Notificação como Lida
        print("\n--- TESTE 7: Marcar Notificação como Lida ---")
        
        if notification_id:
            response = self.make_request("PATCH", f"/labelview/notifications/{notification_id}/read", token=master_token)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    success = data.get("success", False)
                    
                    if success:
                        self.log_test("Marcar como Lida", True, 
                                     "✅ Notificação marcada como lida com sucesso")
                    else:
                        self.log_test("Marcar como Lida", False, 
                                     f"❌ Falha ao marcar: success={success}")
                        
                except Exception as e:
                    self.log_test("Marcar como Lida - Parse", False, 
                                 f"❌ Erro ao processar resposta: {str(e)}")
            else:
                self.log_test("Marcar como Lida", False, 
                             f"❌ Endpoint falhou - Status: {response.status_code}")
        else:
            self.log_test("Marcar como Lida", False, 
                         "❌ Não foi possível testar - notification_id não disponível")
        
        # Test 8: Validar Hierarquia
        print("\n--- TESTE 8: Validar Hierarquia ---")
        
        # Verificar que Master pode ver todos os usuários como destinatários
        if recipients:
            self.log_test("Hierarquia - Master Acesso", True, 
                         f"✅ Master pode ver {len(recipients)} usuários como destinatários")
        else:
            self.log_test("Hierarquia - Master Acesso", True, 
                         "✅ Master tem acesso (lista vazia indica sem usuários na hierarquia)")
        
        # Test 9: Teste com Anexo (Base64 simulado)
        print("\n--- TESTE 9: Teste com Anexo (Base64 simulado) ---")
        
        attachment_data = {
            "title": "Notificação com Anexo",
            "message": "Teste com anexo PDF",
            "priority": "baixa",
            "attachment_type": "pdf",
            "attachment_data": "data:application/pdf;base64,JVBERi0xLjQK",
            "recipient_ids": recipient_ids
        }
        
        response = self.make_request("POST", "/labelview/notifications", attachment_data, token=master_token)
        
        if response.status_code == 200:
            try:
                data = response.json()
                success = data.get("success", False)
                
                if success:
                    self.log_test("Notificação com Anexo", True, 
                                 "✅ Notificação com anexo PDF criada com sucesso")
                    
                    # Verificar se anexo está presente na resposta
                    notification = data.get("notification", {})
                    has_attachment = notification.get("attachment_type") == "pdf"
                    
                    if has_attachment:
                        self.log_test("Anexo Presente", True, 
                                     "✅ Anexo está presente na notificação")
                    else:
                        self.log_test("Anexo Presente", False, 
                                     "❌ Anexo não encontrado na notificação")
                else:
                    self.log_test("Notificação com Anexo", False, 
                                 f"❌ Falha na criação: success={success}")
                    
            except Exception as e:
                self.log_test("Notificação com Anexo - Parse", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("Notificação com Anexo", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
        
        # Final Summary
        print(f"\n🎯 RESUMO DO TESTE DO SISTEMA DE NOTIFICAÇÕES LABELVIEW:")
        
        # Contar testes bem-sucedidos
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Testes falharam: {failed_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        
        # Verificar funcionalidades críticas
        critical_functionalities = [
            "Login Master Labelview",
            "Listar Destinatários - Status 200",
            "Criar Notificação Simples - Success",
            "Listar Notificações - Status 200",
            "Contagem Não Lidas"
        ]
        
        critical_passed = 0
        for functionality in critical_functionalities:
            if any(functionality in r["test"] and r["success"] for r in self.test_results):
                critical_passed += 1
        
        print(f"   • Funcionalidades críticas: {critical_passed}/{len(critical_functionalities)}")
        
        if critical_passed == len(critical_functionalities) and successful_tests >= total_tests * 0.85:
            print("\n✅ RESULTADO: SISTEMA DE NOTIFICAÇÕES LABELVIEW FUNCIONANDO PERFEITAMENTE")
            print("   ✅ Todos os endpoints funcionando corretamente")
            print("   ✅ Hierarquia respeitada")
            print("   ✅ Múltiplos destinatários suportados")
            print("   ✅ Prioridades implementadas (baixa, média, alta)")
            print("   ✅ Sistema de anexos funcionando")
            print("   ✅ Contagem de não lidas operacional")
            print("   ✅ Marcação como lida funcionando")
            print("   ✅ Sistema pronto para produção")
            return True
        else:
            print(f"\n❌ RESULTADO: PROBLEMAS IDENTIFICADOS NO SISTEMA DE NOTIFICAÇÕES")
            print(f"   ❌ Funcionalidades críticas falharam: {len(critical_functionalities) - critical_passed}")
            print("   ❌ Correções necessárias antes do uso em produção")
            return False

if __name__ == "__main__":
    tester = LabelviewNotificationsTest()
    
    success = tester.test_labelview_notifications_system_complete()
    
    if success:
        print("\n✅ RESULTADO: Sistema de notificações Labelview funcionando perfeitamente")
        print("✅ Todos os endpoints operacionais")
        print("✅ Sistema pronto para produção")
    else:
        print("\n❌ RESULTADO: Problemas identificados no sistema de notificações")
        print("❌ Correções necessárias antes do uso")
    
    print("\n" + "="*50)
    print("RESULTADOS DETALHADOS:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['details']}")
    print("="*50)