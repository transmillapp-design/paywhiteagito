#!/usr/bin/env python3
"""
Labelview System Testing - Simple Authentication Test
Testing the vehicle protection management system authentication
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class LabelviewSimpleTester:
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_labelview_authentication(self):
        """🎯 TESTE CRÍTICO DE AUTENTICAÇÃO MASTER LABELVIEW"""
        print("\n🎯 TESTE CRÍTICO DE AUTENTICAÇÃO MASTER LABELVIEW")
        print("=" * 80)
        print("CONTEXTO:")
        print("- Sistema Labelview é um painel administrativo para gestão de colaboradores")
        print("- Testando apenas a autenticação do Master Labelview")
        print("")
        print("CREDENCIAIS DE TESTE:")
        print("**Master Labelview:**")
        print("- Email: protecao@agitomil.com")
        print("- Senha: demo123")
        print("- Permissão: is_labelview_master = true")
        print("")
        print("VALIDAÇÕES:")
        print("✅ Login funcionando")
        print("✅ Token JWT retornado")
        print("✅ user.is_labelview_master = true")
        print("✅ user_type correto")
        print("✅ Conta ativa (is_blocked = false)")
        print("=" * 80)
        
        # Test 1: Autenticação Master Labelview
        print("\n--- TESTE 1: Autenticação Master Labelview ---")
        
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
            
            # Validar status 200
            self.log_test("Master Login - Status 200", True, 
                         "✅ Login retorna status 200")
            
            # Validar token JWT retornado
            if master_token:
                self.log_test("Master Login - Token JWT", True, 
                             "✅ Token JWT retornado com sucesso")
            else:
                self.log_test("Master Login - Token JWT", False, 
                             "❌ Token não retornado")
                return False
            
            # Validar is_labelview_master = true
            is_labelview_master = master_user.get("is_labelview_master", False)
            if is_labelview_master:
                self.log_test("Master Login - Labelview Master", True, 
                             "✅ is_labelview_master = true")
            else:
                self.log_test("Master Login - Labelview Master", False, 
                             f"❌ is_labelview_master = {is_labelview_master} (esperado: true)")
            
            # Validar user_type correto
            user_type = master_user.get("user_type")
            if user_type in ["labelview_master", "master"]:
                self.log_test("Master Login - User Type", True, 
                             f"✅ user_type = '{user_type}' (válido)")
            else:
                self.log_test("Master Login - User Type", False, 
                             f"❌ user_type = '{user_type}' (esperado: labelview_master ou master)")
            
            # Validar conta ativa
            is_blocked = master_user.get("is_blocked", False)
            if not is_blocked:
                self.log_test("Master Login - Conta Ativa", True, 
                             "✅ Conta ativa (is_blocked = false)")
            else:
                self.log_test("Master Login - Conta Ativa", False, 
                             "❌ Conta bloqueada (is_blocked = true)")
            
            print(f"🔍 Dados do master logado:")
            print(f"   📧 Email: {master_user.get('email')}")
            print(f"   👤 Nome: {master_user.get('full_name')}")
            print(f"   🆔 ID: {master_user.get('id')}")
            print(f"   🏢 Tipo: {master_user.get('user_type')}")
            print(f"   🔓 Labelview Master: {master_user.get('is_labelview_master')}")
            print(f"   🔓 Bloqueado: {master_user.get('is_blocked', False)}")
            
        else:
            self.log_test("Master Login - Status 200", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                print(f"❌ Erro sem detalhes - Status: {response.status_code}")
            return False
        
        # Test 2: Teste de Permissões (Segurança)
        print("\n--- TESTE 2: Teste de Permissões (Segurança) ---")
        
        # Tentar acessar com token de cliente comum
        client_login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        client_response = self.make_request("POST", "/auth/login", client_login_data)
        
        if client_response.status_code == 200:
            client_data = client_response.json()
            client_token = client_data.get("access_token")
            client_user = client_data.get("user", {})
            
            # Verificar que cliente NÃO é labelview master
            client_is_labelview_master = client_user.get("is_labelview_master", False)
            if not client_is_labelview_master:
                self.log_test("Security - Client Not Master", True, 
                             "✅ Cliente comum não tem is_labelview_master = true")
            else:
                self.log_test("Security - Client Not Master", False, 
                             "❌ Cliente comum tem is_labelview_master = true (problema de segurança)")
            
            print(f"🔍 Dados do cliente (para comparação):")
            print(f"   📧 Email: {client_user.get('email')}")
            print(f"   👤 Nome: {client_user.get('full_name')}")
            print(f"   🏢 Tipo: {client_user.get('user_type')}")
            print(f"   🔓 Labelview Master: {client_user.get('is_labelview_master', False)}")
            
        else:
            self.log_test("Security - Client Login", False, 
                         "❌ Não foi possível fazer login como cliente para teste")
        
        # Final Summary
        print(f"\n🎯 RESULTADO FINAL DO TESTE DE AUTENTICAÇÃO LABELVIEW:")
        
        # Verificar se todos os testes críticos passaram
        critical_tests = [
            "Master Login - Status 200",
            "Master Login - Token JWT",
            "Master Login - Labelview Master",
            "Master Login - User Type",
            "Master Login - Conta Ativa"
        ]
        
        critical_passed = 0
        for test_name in critical_tests:
            if any(test_name in r["test"] and r["success"] for r in self.test_results):
                critical_passed += 1
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Testes críticos: {critical_passed}/{len(critical_tests)}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        
        if critical_passed == len(critical_tests):
            print("\n✅ RESULTADO: AUTENTICAÇÃO MASTER LABELVIEW FUNCIONANDO")
            print("   ✅ Login master funcionando perfeitamente")
            print("   ✅ Token JWT válido")
            print("   ✅ Permissões corretas (is_labelview_master = true)")
            print("   ✅ Conta ativa e pronta para uso")
            print("   ✅ Sistema de autenticação validado")
            return True
        else:
            print(f"\n❌ RESULTADO: PROBLEMAS NA AUTENTICAÇÃO LABELVIEW")
            print(f"   ❌ {len(critical_tests) - critical_passed} testes críticos falharam")
            print("   ❌ Correções necessárias antes do uso")
            return False

if __name__ == "__main__":
    tester = LabelviewSimpleTester()
    tester.test_labelview_authentication()