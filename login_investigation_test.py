#!/usr/bin/env python3
"""
🚨 INVESTIGAÇÃO ESPECÍFICA: ERRO DE LOGIN agitoautobrasil@gmail.com
Teste focado para investigar problema de login específico
"""

import requests
import json
import time
import subprocess
from datetime import datetime

class LoginInvestigationTester:
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
        
    def make_request(self, method: str, endpoint: str, data: dict = None) -> requests.Response:
        """Make HTTP request"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
            
        try:
            if method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            else:
                response = self.session.get(url, headers=headers)
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def run_investigation(self):
        """🚨 INVESTIGAÇÃO ESPECÍFICA: ERRO DE LOGIN agitoautobrasil@gmail.com"""
        print("\n🚨 INVESTIGAÇÃO ESPECÍFICA: ERRO DE LOGIN agitoautobrasil@gmail.com")
        print("=" * 80)
        print("CREDENCIAIS COM PROBLEMA:")
        print("- Email: agitoautobrasil@gmail.com")
        print("- Senha: Q9zm9AJn9EMa")
        print("- Status: Erro de login")
        print("")
        print("INVESTIGAÇÃO COMPLETA:")
        print("")
        print("**TESTE 1: Verificar se usuário existe**")
        print("- Buscar no MongoDB: db.users.find_one({'email': 'agitoautobrasil@gmail.com'})")
        print("- Verificar se o documento existe")
        print("- Verificar campos presentes no documento")
        print("")
        print("**TESTE 2: Tentar login direto**")
        print("- POST /api/auth/login")
        print("- Email: agitoautobrasil@gmail.com")
        print("- Senha: Q9zm9AJn9EMa")
        print("- Capturar erro EXATO retornado")
        print("- Verificar status code (401, 400, 500?)")
        print("")
        print("**TESTE 3: Verificar estrutura do usuário**")
        print("Se encontrado no banco, verificar:")
        print("- ✅ Tem campo 'email'?")
        print("- ✅ Tem campo 'password_hash'?")
        print("- ✅ Tem campo 'user_type'?")
        print("- ✅ Tem campo 'full_name'?")
        print("- ✅ Tem campo 'phone'?")
        print("- ✅ Está ativo (is_active = true)?")
        print("- ✅ Não está bloqueado (is_blocked = false)?")
        print("")
        print("**TESTE 4: Verificar hash da senha**")
        print("- Comparar se o password_hash existe")
        print("- Verificar se é um hash bcrypt válido (começa com $2b$)")
        print("- Tentar verificar a senha fornecida contra o hash")
        print("")
        print("**TESTE 5: Comparar com usuário que funciona**")
        print("- Buscar usuário que funciona: protecao@agitomil.com")
        print("- Comparar estrutura de campos")
        print("- Identificar o que está diferente")
        print("")
        print("**VALIDAÇÕES CRÍTICAS:**")
        print("- ❌ Por que o login falha?")
        print("- ❌ Erro 401 (senha errada)?")
        print("- ❌ Erro 404 (usuário não existe)?")
        print("- ❌ Erro 500 (problema no servidor)?")
        print("- ❌ Campo obrigatório faltando?")
        print("- ❌ Senha não bate com o hash?")
        print("")
        print("**IMPORTANTE:**")
        print("- Capturar mensagem de erro COMPLETA")
        print("- Capturar logs do backend no momento do login")
        print("- Verificar se é problema de senha ou estrutura de dados")
        print("- Se usuário não existe, informar para criar")
        print("- Se senha errada, informar para resetar")
        print("=" * 80)
        
        # Test 1: Verificar se usuário existe no banco
        print("\n--- TESTE 1: VERIFICAR SE USUÁRIO EXISTE NO BANCO ---")
        
        # Simular busca no MongoDB através de tentativa de login com senha incorreta
        # Se retornar 401, usuário existe mas senha está errada
        # Se retornar 404, usuário não existe
        
        test_login_data = {
            "email": "agitoautobrasil@gmail.com",
            "password": "senha_incorreta_teste"
        }
        
        response = self.make_request("POST", "/auth/login", test_login_data)
        
        user_exists = False
        if response.status_code == 401:
            user_exists = True
            self.log_test("User Exists Check", True, 
                         "✅ Usuário agitoautobrasil@gmail.com EXISTE no banco (retornou 401 com senha incorreta)")
        elif response.status_code == 404:
            user_exists = False
            self.log_test("User Exists Check", False, 
                         "❌ Usuário agitoautobrasil@gmail.com NÃO EXISTE no banco (retornou 404)")
        else:
            self.log_test("User Exists Check", False, 
                         f"⚠️ Status inesperado ao verificar existência: {response.status_code}")
        
        # Test 2: Tentar login direto com credenciais reportadas
        print("\n--- TESTE 2: TENTAR LOGIN DIRETO COM CREDENCIAIS REPORTADAS ---")
        
        problem_login_data = {
            "email": "agitoautobrasil@gmail.com",
            "password": "Q9zm9AJn9EMa"
        }
        
        response = self.make_request("POST", "/auth/login", problem_login_data)
        
        print(f"🔍 RESULTADO DO LOGIN:")
        print(f"   📊 Status Code: {response.status_code}")
        
        login_successful = False
        error_details = ""
        
        if response.status_code == 200:
            login_successful = True
            data = response.json()
            token = data.get("access_token")
            user_data = data.get("user", {})
            
            self.log_test("Direct Login Test", True, 
                         "✅ LOGIN FUNCIONOU! Credenciais agitoautobrasil@gmail.com/Q9zm9AJn9EMa estão corretas")
            
            print(f"   ✅ Token JWT: {token[:50]}..." if token else "   ❌ Token não retornado")
            print(f"   👤 Nome: {user_data.get('full_name', 'N/A')}")
            print(f"   🏢 Tipo: {user_data.get('user_type', 'N/A')}")
            print(f"   🆔 ID: {user_data.get('id', 'N/A')}")
            
        elif response.status_code == 401:
            try:
                error_data = response.json()
                error_details = error_data.get("detail", "Erro de autenticação")
                
                self.log_test("Direct Login Test", False, 
                             f"❌ LOGIN FALHOU - Status 401: {error_details}")
                
                print(f"   ❌ Erro 401: {error_details}")
                
                # Verificar se é problema de senha ou usuário
                if "senha" in error_details.lower() or "password" in error_details.lower():
                    print("   🔍 DIAGNÓSTICO: Problema com a SENHA")
                elif "usuário" in error_details.lower() or "user" in error_details.lower():
                    print("   🔍 DIAGNÓSTICO: Problema com o USUÁRIO")
                else:
                    print("   🔍 DIAGNÓSTICO: Erro de autenticação genérico")
                    
            except:
                self.log_test("Direct Login Test", False, 
                             "❌ LOGIN FALHOU - Status 401 (sem detalhes do erro)")
                error_details = "Erro 401 sem detalhes"
                
        elif response.status_code == 404:
            self.log_test("Direct Login Test", False, 
                         "❌ LOGIN FALHOU - Status 404: Usuário não encontrado")
            error_details = "Usuário não encontrado"
            print("   ❌ Erro 404: Usuário não encontrado no banco de dados")
            
        elif response.status_code == 500:
            try:
                error_data = response.json()
                error_details = error_data.get("detail", "Erro interno do servidor")
                
                self.log_test("Direct Login Test", False, 
                             f"❌ LOGIN FALHOU - Status 500: {error_details}")
                print(f"   ❌ Erro 500: {error_details}")
                print("   🔍 DIAGNÓSTICO: Problema no servidor/banco de dados")
                
            except:
                self.log_test("Direct Login Test", False, 
                             "❌ LOGIN FALHOU - Status 500 (erro interno)")
                error_details = "Erro interno do servidor"
                
        else:
            self.log_test("Direct Login Test", False, 
                         f"❌ LOGIN FALHOU - Status inesperado: {response.status_code}")
            error_details = f"Status inesperado: {response.status_code}"
            print(f"   ❌ Status inesperado: {response.status_code}")
        
        # Test 3: Comparar com usuário que funciona (protecao@agitomil.com)
        print("\n--- TESTE 3: COMPARAR COM USUÁRIO QUE FUNCIONA ---")
        
        working_login_data = {
            "email": "protecao@agitomil.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", working_login_data)
        
        if response.status_code == 200:
            data = response.json()
            working_user = data.get("user", {})
            
            self.log_test("Working User Comparison", True, 
                         "✅ Usuário protecao@agitomil.com funciona normalmente")
            
            print(f"🔍 ESTRUTURA DO USUÁRIO QUE FUNCIONA:")
            print(f"   📧 Email: {working_user.get('email')}")
            print(f"   👤 Nome: {working_user.get('full_name')}")
            print(f"   🏢 Tipo: {working_user.get('user_type')}")
            print(f"   🆔 ID: {working_user.get('id')}")
            print(f"   ✅ Ativo: {working_user.get('is_active', 'N/A')}")
            print(f"   🚫 Bloqueado: {working_user.get('is_blocked', 'N/A')}")
            print(f"   📱 Telefone: {working_user.get('phone', 'N/A')}")
            print(f"   🔐 Tem password_hash: {'Sim' if 'password_hash' in working_user else 'Não'}")
            
            # Verificar campos obrigatórios
            required_fields = ['email', 'full_name', 'user_type', 'id', 'phone']
            missing_fields = [field for field in required_fields if not working_user.get(field)]
            
            if not missing_fields:
                self.log_test("Working User Structure", True, 
                             "✅ Usuário que funciona tem todos os campos obrigatórios")
            else:
                self.log_test("Working User Structure", False, 
                             f"❌ Usuário que funciona tem campos faltando: {missing_fields}")
                
        else:
            self.log_test("Working User Comparison", False, 
                         f"❌ Usuário protecao@agitomil.com também não funciona! Status: {response.status_code}")
        
        # Test 4: Verificar logs do backend
        print("\n--- TESTE 4: VERIFICAR LOGS DO BACKEND ---")
        
        # Tentar capturar logs do supervisor
        try:
            result = subprocess.run(['tail', '-n', '20', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0 and result.stdout.strip():
                self.log_test("Backend Logs Check", True, 
                             "✅ Logs do backend capturados")
                
                print(f"📋 ÚLTIMAS 20 LINHAS DO LOG DE ERRO:")
                print("=" * 60)
                print(result.stdout)
                print("=" * 60)
                
                # Procurar por erros relacionados ao login
                if "agitoautobrasil@gmail.com" in result.stdout:
                    print("🔍 ENCONTRADO: Logs relacionados ao email agitoautobrasil@gmail.com")
                if "login" in result.stdout.lower():
                    print("🔍 ENCONTRADO: Logs relacionados a login")
                if "error" in result.stdout.lower():
                    print("🔍 ENCONTRADO: Logs de erro")
                    
            else:
                self.log_test("Backend Logs Check", False, 
                             "⚠️ Não foi possível capturar logs do backend")
                
        except Exception as e:
            self.log_test("Backend Logs Check", False, 
                         f"❌ Erro ao capturar logs: {str(e)}")
        
        # Test 5: Teste com outros usuários similares
        print("\n--- TESTE 5: TESTE COM OUTROS USUÁRIOS LABELVIEW ---")
        
        other_labelview_users = [
            {"email": "agitoauto@agitomil.com", "password": "demo123", "name": "AgitoAuto"},
            {"email": "regional@agitomil.com", "password": "demo123", "name": "Regional"},
            {"email": "rafael@agitomil.com", "password": "demo123", "name": "Rafael"}
        ]
        
        working_labelview_count = 0
        
        for user_test in other_labelview_users:
            test_data = {
                "email": user_test["email"],
                "password": user_test["password"]
            }
            
            response = self.make_request("POST", "/auth/login", test_data)
            
            if response.status_code == 200:
                working_labelview_count += 1
                self.log_test(f"Labelview User Test - {user_test['name']}", True, 
                             f"✅ {user_test['email']} funciona normalmente")
            else:
                self.log_test(f"Labelview User Test - {user_test['name']}", False, 
                             f"❌ {user_test['email']} também não funciona (Status: {response.status_code})")
        
        print(f"\n📊 RESULTADO DOS TESTES LABELVIEW:")
        print(f"   • Usuários Labelview testados: {len(other_labelview_users)}")
        print(f"   • Usuários funcionando: {working_labelview_count}")
        print(f"   • Taxa de sucesso: {(working_labelview_count/len(other_labelview_users)*100):.1f}%")
        
        # DIAGNÓSTICO FINAL
        print(f"\n🎯 DIAGNÓSTICO FINAL - agitoautobrasil@gmail.com:")
        print("=" * 80)
        
        if login_successful:
            print("✅ RESULTADO: LOGIN FUNCIONANDO!")
            print("   ✅ Credenciais agitoautobrasil@gmail.com/Q9zm9AJn9EMa estão corretas")
            print("   ✅ Usuário consegue fazer login normalmente")
            print("   ✅ Problema pode ter sido resolvido ou não existia")
            
        elif not user_exists:
            print("❌ RESULTADO: USUÁRIO NÃO EXISTE NO BANCO DE DADOS")
            print("   ❌ Email agitoautobrasil@gmail.com não foi encontrado")
            print("   🔧 SOLUÇÃO: Criar usuário no sistema")
            print("   📝 AÇÃO: Executar script de criação de usuário ou cadastro manual")
            
        elif response.status_code == 401:
            print("❌ RESULTADO: SENHA INCORRETA")
            print("   ❌ Usuário existe mas senha Q9zm9AJn9EMa não confere")
            print("   🔧 SOLUÇÃO: Resetar senha do usuário")
            print("   📝 AÇÃO: Usar funcionalidade de recuperação de senha")
            
        elif response.status_code == 500:
            print("❌ RESULTADO: ERRO NO SERVIDOR")
            print("   ❌ Problema técnico no backend ou banco de dados")
            print("   🔧 SOLUÇÃO: Verificar logs do servidor e corrigir erro")
            print("   📝 AÇÃO: Analisar logs detalhados e corrigir problema técnico")
            
        else:
            print("❌ RESULTADO: ERRO DESCONHECIDO")
            print(f"   ❌ Status code inesperado: {response.status_code}")
            print(f"   ❌ Detalhes: {error_details}")
            print("   🔧 SOLUÇÃO: Investigação técnica mais profunda necessária")
        
        # Recomendações específicas
        print(f"\n📋 RECOMENDAÇÕES ESPECÍFICAS:")
        
        if not login_successful:
            if not user_exists:
                print("1. 🔧 CRIAR USUÁRIO:")
                print("   - Executar script de criação de usuário")
                print("   - Ou usar painel admin para criar manualmente")
                print("   - Definir senha Q9zm9AJn9EMa")
                
            elif response.status_code == 401:
                print("1. 🔐 RESETAR SENHA:")
                print("   - Usar endpoint de recuperação de senha")
                print("   - Ou atualizar password_hash diretamente no banco")
                print("   - Confirmar que hash bcrypt está correto")
                
            elif response.status_code == 500:
                print("1. 🔧 CORRIGIR ERRO TÉCNICO:")
                print("   - Analisar logs detalhados do backend")
                print("   - Verificar conexão com MongoDB")
                print("   - Verificar estrutura de dados do usuário")
                
            print("2. 🧪 TESTAR NOVAMENTE:")
            print("   - Após aplicar correção, testar login novamente")
            print("   - Confirmar que usuário consegue acessar sistema")
            
        print(f"\n🏁 INVESTIGAÇÃO CONCLUÍDA")
        print("=" * 80)
        
        return login_successful

if __name__ == "__main__":
    tester = LoginInvestigationTester()
    success = tester.run_investigation()
    
    print("\n" + "="*50)
    print("RESULTADOS DETALHADOS:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['details']}")
    print("="*50)
    
    if success:
        print("\n✅ RESULTADO FINAL: LOGIN FUNCIONANDO - PROBLEMA RESOLVIDO!")
    else:
        print("\n❌ RESULTADO FINAL: PROBLEMA DE LOGIN IDENTIFICADO - CORREÇÃO NECESSÁRIA!")