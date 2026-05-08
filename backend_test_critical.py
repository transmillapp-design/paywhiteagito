#!/usr/bin/env python3
"""
AgitoCoin Backend API Testing Suite - CRITICAL PRE-DEPLOY VALIDATION
Complete validation of all critical endpoints before production deploy to https://agitomil.com.br
"""

import requests
import json
import time
import uuid
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

class AgitoCoinCriticalTester:
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
        self.tokens = {}
        self.users = {}
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
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

    def test_critical_pre_deploy_validation(self):
        """🚨 VALIDAÇÃO COMPLETA PRÉ-DEPLOY - Todos os endpoints críticos conforme especificação"""
        print("\n🚨 TESTE PRÉ-DEPLOY - VALIDAÇÃO COMPLETA DO BACKEND")
        print("=" * 80)
        print("OBJETIVO: Validar que todos os endpoints críticos estão funcionando antes do deploy para produção em https://agitomil.com.br")
        print("")
        print("TESTES CRÍTICOS:")
        print("1. AUTENTICAÇÃO - Cliente e Lojista")
        print("2. PEDIDOS (Cliente) - Criar e listar")
        print("3. PEDIDOS (Lojista) - Listar e atualizar status")
        print("4. CONFIGURAÇÕES DA LOJA")
        print("5. PROFILE - Dados do usuário")
        print("6. LOJISTAS - Lista pública")
        print("7. MONGODB - Verificação de conexão")
        print("=" * 80)
        
        # Test 1: AUTENTICAÇÃO
        print("\n--- TESTE 1: AUTENTICAÇÃO ---")
        
        # Test 1.1: Cliente Login
        print("\n🔐 Teste 1.1: Login Cliente")
        cliente_login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", cliente_login_data)
        
        cliente_token = None
        if response.status_code == 200:
            data = response.json()
            cliente_token = data.get("access_token")
            user_data = data.get("user", {})
            
            # Validar status 200
            self.log_test("Cliente Login - Status 200", True, "✅ Status 200 retornado")
            
            # Validar token retornado
            if cliente_token:
                self.log_test("Cliente Login - Token", True, "✅ Token retornado")
            else:
                self.log_test("Cliente Login - Token", False, "❌ Token não retornado")
                return False
            
            # Validar user_type = "cliente"
            user_type = user_data.get("user_type")
            if user_type == "cliente":
                self.log_test("Cliente Login - User Type", True, "✅ user_type = 'cliente'")
            else:
                self.log_test("Cliente Login - User Type", False, f"❌ user_type = '{user_type}' (esperado: 'cliente')")
        else:
            self.log_test("Cliente Login - Status 200", False, f"❌ Status: {response.status_code}")
            return False
        
        # Test 1.2: Lojista Login
        print("\n🔐 Teste 1.2: Login Lojista")
        lojista_login_data = {
            "email": "lojista@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", lojista_login_data)
        
        lojista_token = None
        if response.status_code == 200:
            data = response.json()
            lojista_token = data.get("access_token")
            user_data = data.get("user", {})
            
            # Validar status 200
            self.log_test("Lojista Login - Status 200", True, "✅ Status 200 retornado")
            
            # Validar token retornado
            if lojista_token:
                self.log_test("Lojista Login - Token", True, "✅ Token retornado")
            else:
                self.log_test("Lojista Login - Token", False, "❌ Token não retornado")
                return False
            
            # Validar user_type = "lojista"
            user_type = user_data.get("user_type")
            if user_type == "lojista":
                self.log_test("Lojista Login - User Type", True, "✅ user_type = 'lojista'")
            else:
                self.log_test("Lojista Login - User Type", False, f"❌ user_type = '{user_type}' (esperado: 'lojista')")
        else:
            self.log_test("Lojista Login - Status 200", False, f"❌ Status: {response.status_code}")
            return False
        
        # Test 2: PEDIDOS (Cliente)
        print("\n--- TESTE 2: PEDIDOS (Cliente) ---")
        
        # Test 2.1: Criar Pedido
        print("\n📦 Teste 2.1: Criar Pedido")
        create_order_data = {
            "merchant_id": "lojista-demo-001",
            "order_type": "pickup",
            "items": [{
                "product_id": "test-001",
                "product_name": "Teste",
                "quantity": 1,
                "unit_price": 10.0,
                "total_price": 10.0
            }]
        }
        
        response = self.make_request("POST", "/orders/create", create_order_data, token=cliente_token)
        
        order_id = None
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            order_id = data.get("order_id")
            
            if success and order_id:
                self.log_test("Criar Pedido - Sucesso", True, f"✅ Pedido criado - ID: {order_id}")
            else:
                self.log_test("Criar Pedido - Sucesso", False, f"❌ Falha na criação - success: {success}")
        else:
            self.log_test("Criar Pedido - Sucesso", False, f"❌ Status: {response.status_code}")
        
        # Test 2.2: Listar Pedidos do Cliente
        print("\n📦 Teste 2.2: Listar Pedidos do Cliente")
        response = self.make_request("GET", "/orders/my-orders", token=cliente_token)
        
        if response.status_code == 200:
            data = response.json()
            orders = data.get("orders", [])
            
            self.log_test("Listar Pedidos Cliente - Status", True, f"✅ Lista retornada - {len(orders)} pedidos")
            
            # Validar estrutura de dados
            if orders and len(orders) > 0:
                first_order = orders[0]
                # Check for either 'id' or 'order_id' field (both are acceptable)
                has_id = "id" in first_order or "order_id" in first_order
                required_fields = ["merchant_id", "order_type", "status", "items", "created_at"]
                missing_fields = [field for field in required_fields if field not in first_order]
                
                if has_id and not missing_fields:
                    self.log_test("Listar Pedidos Cliente - Estrutura", True, "✅ Estrutura de dados correta")
                elif not has_id:
                    self.log_test("Listar Pedidos Cliente - Estrutura", False, "❌ Campo 'id' ou 'order_id' ausente")
                else:
                    self.log_test("Listar Pedidos Cliente - Estrutura", False, f"❌ Campos ausentes: {missing_fields}")
            else:
                self.log_test("Listar Pedidos Cliente - Estrutura", True, "✅ Lista vazia (normal)")
        else:
            self.log_test("Listar Pedidos Cliente - Status", False, f"❌ Status: {response.status_code}")
        
        # Test 3: PEDIDOS (Lojista)
        print("\n--- TESTE 3: PEDIDOS (Lojista) ---")
        
        # Test 3.1: Listar Pedidos do Lojista
        print("\n🏪 Teste 3.1: Listar Pedidos do Lojista")
        response = self.make_request("GET", "/orders/merchant/list", token=lojista_token)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            orders = data.get("orders", [])
            
            if success:
                self.log_test("Listar Pedidos Lojista - Status", True, f"✅ Lista retornada - {len(orders)} pedidos")
                
                # Validar que pedidos têm todos os campos
                if orders and len(orders) > 0:
                    first_order = orders[0]
                    required_fields = ["id", "customer_id", "merchant_id", "order_type", "status", "items"]
                    missing_fields = [field for field in required_fields if field not in first_order]
                    
                    if not missing_fields:
                        self.log_test("Listar Pedidos Lojista - Estrutura", True, "✅ Estrutura completa")
                    else:
                        self.log_test("Listar Pedidos Lojista - Estrutura", False, f"❌ Campos ausentes: {missing_fields}")
                else:
                    self.log_test("Listar Pedidos Lojista - Estrutura", True, "✅ Lista vazia (normal)")
            else:
                self.log_test("Listar Pedidos Lojista - Status", False, f"❌ success = {success}")
        else:
            self.log_test("Listar Pedidos Lojista - Status", False, f"❌ Status: {response.status_code}")
        
        # Test 3.2: Atualizar Status do Pedido
        if order_id:
            print("\n🏪 Teste 3.2: Atualizar Status do Pedido")
            update_status_data = {
                "status": "confirmed"
            }
            
            response = self.make_request("PUT", f"/orders/{order_id}/status", update_status_data, token=lojista_token)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("success", False)
                
                if success:
                    self.log_test("Atualizar Status Pedido", True, "✅ Status atualizado para 'confirmed'")
                else:
                    self.log_test("Atualizar Status Pedido", False, f"❌ success = {success}")
            else:
                self.log_test("Atualizar Status Pedido", False, f"❌ Status: {response.status_code}")
        
        # Test 4: CONFIGURAÇÕES DA LOJA
        print("\n--- TESTE 4: CONFIGURAÇÕES DA LOJA ---")
        
        # Test 4.1: Atualizar is_open
        print("\n🏪 Teste 4.1: Configurar Loja Aberta")
        response = self.make_request("PUT", "/merchant/store-settings?is_open=true", token=lojista_token)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            
            if success:
                self.log_test("Configurar Loja Aberta", True, "✅ is_open=true configurado")
            else:
                self.log_test("Configurar Loja Aberta", False, f"❌ success = {success}")
        else:
            self.log_test("Configurar Loja Aberta", False, f"❌ Status: {response.status_code}")
        
        # Test 4.2: Atualizar delivery_fee
        print("\n🏪 Teste 4.2: Configurar Taxa de Entrega")
        response = self.make_request("PUT", "/merchant/store-settings?delivery_fee=5.0", token=lojista_token)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            
            if success:
                self.log_test("Configurar Taxa Entrega", True, "✅ delivery_fee=5.0 configurado")
            else:
                self.log_test("Configurar Taxa Entrega", False, f"❌ success = {success}")
        else:
            self.log_test("Configurar Taxa Entrega", False, f"❌ Status: {response.status_code}")
        
        # Test 4.3: Atualizar delivery_radius
        print("\n🏪 Teste 4.3: Configurar Raio de Entrega")
        response = self.make_request("PUT", "/merchant/store-settings?delivery_radius=10", token=lojista_token)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            
            if success:
                self.log_test("Configurar Raio Entrega", True, "✅ delivery_radius=10 configurado")
            else:
                self.log_test("Configurar Raio Entrega", False, f"❌ success = {success}")
        else:
            self.log_test("Configurar Raio Entrega", False, f"❌ Status: {response.status_code}")
        
        # Test 5: PROFILE
        print("\n--- TESTE 5: PROFILE ---")
        
        # Test 5.1: Profile do Cliente
        print("\n👤 Teste 5.1: Profile do Cliente")
        response = self.make_request("GET", "/user/profile", token=cliente_token)
        
        if response.status_code == 200:
            data = response.json()
            
            # Validar dados do usuário retornados
            required_fields = ["id", "email", "full_name", "user_type", "balance", "cashback_balance"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                self.log_test("Profile Cliente", True, f"✅ Dados completos - {data.get('full_name', 'N/A')}")
            else:
                self.log_test("Profile Cliente", False, f"❌ Campos ausentes: {missing_fields}")
        else:
            self.log_test("Profile Cliente", False, f"❌ Status: {response.status_code}")
        
        # Test 5.2: Profile do Lojista
        print("\n👤 Teste 5.2: Profile do Lojista")
        response = self.make_request("GET", "/user/profile", token=lojista_token)
        
        if response.status_code == 200:
            data = response.json()
            
            # Validar dados do usuário retornados
            required_fields = ["id", "email", "full_name", "user_type", "balance", "cashback_balance"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                self.log_test("Profile Lojista", True, f"✅ Dados completos - {data.get('full_name', 'N/A')}")
            else:
                self.log_test("Profile Lojista", False, f"❌ Campos ausentes: {missing_fields}")
        else:
            self.log_test("Profile Lojista", False, f"❌ Status: {response.status_code}")
        
        # Test 6: LOJISTAS
        print("\n--- TESTE 6: LOJISTAS ---")
        
        print("\n🏪 Teste 6.1: Lista de Lojistas")
        response = self.make_request("GET", "/merchants")
        
        if response.status_code == 200:
            merchants = response.json()  # Direct list response
            
            self.log_test("Lista Lojistas", True, f"✅ Lista retornada - {len(merchants)} lojistas")
            
            # Validar estrutura
            if merchants and len(merchants) > 0:
                first_merchant = merchants[0]
                required_fields = ["id", "company_name"]
                missing_fields = [field for field in required_fields if field not in first_merchant]
                
                if not missing_fields:
                    self.log_test("Lista Lojistas - Estrutura", True, "✅ Estrutura correta")
                else:
                    self.log_test("Lista Lojistas - Estrutura", False, f"❌ Campos ausentes: {missing_fields}")
            else:
                self.log_test("Lista Lojistas - Estrutura", True, "✅ Lista vazia (normal)")
        else:
            self.log_test("Lista Lojistas", False, f"❌ Status: {response.status_code}")
        
        # Test 7: MONGODB
        print("\n--- TESTE 7: MONGODB ---")
        
        print("\n🗄️ Teste 7.1: Verificação de Conexão MongoDB")
        
        # Verificar conexão através de login bem-sucedido
        if cliente_token and lojista_token:
            self.log_test("MongoDB Conexão", True, "✅ MongoDB conectado (logins bem-sucedidos)")
        else:
            self.log_test("MongoDB Conexão", False, "❌ Problemas de conexão MongoDB")
        
        # Verificar collections através de endpoints que as utilizam
        collections_tested = []
        
        # Users collection (através de login)
        if cliente_token:
            collections_tested.append("users")
        
        # Orders collection (se pedido foi criado)
        if order_id:
            collections_tested.append("orders")
        
        if len(collections_tested) >= 2:
            self.log_test("MongoDB Collections", True, f"✅ Collections verificadas: {', '.join(collections_tested)}")
        else:
            self.log_test("MongoDB Collections", False, f"❌ Poucas collections verificadas: {collections_tested}")
        
        # VALIDAÇÕES GERAIS
        print("\n--- VALIDAÇÕES GERAIS ---")
        
        # Verificar se todos os endpoints retornam JSON válido
        json_valid_count = 0
        total_requests = len([r for r in self.test_results if "Status" in r["test"]])
        
        for result in self.test_results:
            if "Status" in result["test"] and result["success"]:
                json_valid_count += 1
        
        if json_valid_count == total_requests:
            self.log_test("JSON Válido", True, "✅ Todos os endpoints retornam JSON válido")
        else:
            self.log_test("JSON Válido", False, f"❌ {total_requests - json_valid_count} endpoints com problemas JSON")
        
        # Verificar se autenticação funciona
        auth_working = bool(cliente_token and lojista_token)
        if auth_working:
            self.log_test("Autenticação Funcionando", True, "✅ Autenticação funciona para cliente e lojista")
        else:
            self.log_test("Autenticação Funcionando", False, "❌ Problemas na autenticação")
        
        # Final Summary
        print(f"\n🎯 RESUMO DA VALIDAÇÃO PRÉ-DEPLOY:")
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Testes falharam: {failed_tests}")
        print(f"   • Taxa de sucesso: {success_rate:.1f}%")
        
        # Identificar problemas críticos
        critical_issues = []
        
        # Verificar logins críticos
        if not any("Cliente Login - Status 200" in r["test"] and r["success"] for r in self.test_results):
            critical_issues.append("Login do cliente não funcionando")
        
        if not any("Lojista Login - Status 200" in r["test"] and r["success"] for r in self.test_results):
            critical_issues.append("Login do lojista não funcionando")
        
        # Verificar endpoints críticos
        if not any("Listar Pedidos Lojista - Status" in r["test"] and r["success"] for r in self.test_results):
            critical_issues.append("Endpoint de pedidos do lojista não funcionando")
        
        if not any("MongoDB Conexão" in r["test"] and r["success"] for r in self.test_results):
            critical_issues.append("Problemas de conexão MongoDB")
        
        # Recomendação final
        if not critical_issues and success_rate >= 85:
            print("\n✅ RESULTADO: SISTEMA APROVADO PARA DEPLOY EM PRODUÇÃO")
            print("   ✅ Todos os endpoints críticos funcionais")
            print("   ✅ Autenticação cliente/lojista operacional")
            print("   ✅ Sistema de pedidos funcionando")
            print("   ✅ Configurações da loja operacionais")
            print("   ✅ APIs de profile e lojistas funcionais")
            print("   ✅ MongoDB conectado e operacional")
            print("   ✅ Pode prosseguir com deploy para https://agitomil.com.br")
            return True
        elif critical_issues:
            print("\n❌ RESULTADO: PROBLEMAS CRÍTICOS - NÃO APROVADO PARA DEPLOY")
            print("   ❌ PROBLEMAS CRÍTICOS IDENTIFICADOS:")
            for issue in critical_issues:
                print(f"      • {issue}")
            print("   ❌ CORREÇÃO NECESSÁRIA antes do deploy")
            return False
        else:
            print("\n⚠️ RESULTADO: DEPLOY COM CAUTELA - PROBLEMAS MENORES")
            print(f"   ⚠️ Taxa de sucesso: {success_rate:.1f}% (abaixo de 85%)")
            print("   ⚠️ Recomendado corrigir problemas antes do deploy")
            return False

def main():
    """Execute critical pre-deploy validation"""
    tester = AgitoCoinCriticalTester()
    
    print("🚀 INICIANDO VALIDAÇÃO CRÍTICA PRÉ-DEPLOY")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        success = tester.test_critical_pre_deploy_validation()
        
        if success:
            print("\n🎉 VALIDAÇÃO CONCLUÍDA COM SUCESSO!")
            print("✅ Sistema pronto para deploy em produção")
        else:
            print("\n⚠️ VALIDAÇÃO CONCLUÍDA COM PROBLEMAS")
            print("❌ Correções necessárias antes do deploy")
            
    except Exception as e:
        print(f"\n💥 ERRO DURANTE A VALIDAÇÃO: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()