#!/usr/bin/env python3
"""
Teste urgente das contas demo do AgitoCash
"""

import requests
import json
import time
import sys

class DemoAccountTester:
    def __init__(self):
        # Try to get backend URL from environment or use default
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
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_demo_accounts_urgent(self):
        """🚨 TESTE URGENTE: Contas demo pararam de funcionar"""
        print("\n🚨 TESTE URGENTE DAS CONTAS DEMO - PROBLEMA REPORTADO")
        print("=" * 80)
        print("PROBLEMA REPORTADO: As contas de demonstração pararam de funcionar novamente.")
        print("\nTESTES CRÍTICOS:")
        print("1. **Teste das 3 contas demo**:")
        print("   - Cliente: cliente@demo.com / demo123")
        print("   - Lojista: lojista@demo.com / demo123")  
        print("   - Master: master@agitocash.com / master123")
        print("\n2. **Diagnóstico específico**:")
        print("   - Verificar se as contas existem no banco")
        print("   - Testar login com cada credencial")
        print("   - Verificar se há erro de hash bcrypt")
        print("   - Verificar estrutura das contas no MongoDB")
        print("   - Identificar se o problema é autenticação ou dados")
        print("\n3. **Validação de JWT**:")
        print("   - Testar se o JWT é gerado corretamente")
        print("   - Verificar se o token é válido após login")
        print("   - Testar acesso aos endpoints protegidos")
        print("\nOBJETIVO: Identificar rapidamente qual o problema específico com as contas demo")
        print("URGÊNCIA: Alta - sistema demo precisa funcionar para testes de integração XGate.")
        print("=" * 80)
        
        demo_credentials = [
            {
                "email": "cliente@demo.com",
                "password": "demo123",
                "type": "cliente",
                "name": "Cliente Demo",
                "expected_fields": ["id", "email", "full_name", "user_type", "balance", "cashback_balance"]
            },
            {
                "email": "lojista@demo.com", 
                "password": "demo123",
                "type": "lojista",
                "name": "Lojista Demo",
                "expected_fields": ["id", "email", "full_name", "user_type", "company_name", "cnpj", "cashback_rate"]
            },
            {
                "email": "master@agitocash.com",
                "password": "master123", 
                "type": "master",
                "name": "Master Demo",
                "expected_fields": ["id", "email", "full_name", "user_type", "is_master_account"]
            }
        ]
        
        successful_logins = 0
        total_tests = 0
        detailed_results = {}
        tokens = {}
        
        for cred in demo_credentials:
            print(f"\n🔸 DIAGNÓSTICO URGENTE: {cred['name'].upper()}")
            print(f"   Email: {cred['email']}")
            print(f"   Senha: {cred['password']}")
            print("-" * 60)
            
            cred_results = {
                "login_success": False,
                "jwt_valid": False,
                "profile_accessible": False,
                "balance_accessible": False,
                "specific_tests": {}
            }
            
            # Test 1: Login Attempt
            print(f"   🔐 TESTE 1: Tentativa de Login...")
            login_data = {
                "email": cred["email"],
                "password": cred["password"]
            }
            
            try:
                response = self.make_request("POST", "/auth/login", login_data)
                total_tests += 1
                
                if response.status_code == 200:
                    data = response.json()
                    token = data["access_token"]
                    user_data = data["user"]
                    successful_logins += 1
                    cred_results["login_success"] = True
                    
                    self.log_test(f"URGENTE {cred['name']} Login", True, 
                                 f"✅ LOGIN FUNCIONANDO - {cred['email']}")
                    
                    # Test 2: JWT Token Analysis
                    print(f"   🎫 TESTE 2: Análise do Token JWT...")
                    total_tests += 1
                    if token and "." in token and len(token.split(".")) == 3:
                        cred_results["jwt_valid"] = True
                        self.log_test(f"URGENTE {cred['name']} JWT", True, 
                                     f"✅ JWT válido - {len(token)} caracteres")
                    else:
                        self.log_test(f"URGENTE {cred['name']} JWT", False, 
                                     f"❌ JWT inválido ou malformado")
                    
                    # Test 3: User Data Structure Validation
                    print(f"   📋 TESTE 3: Validação da Estrutura de Dados...")
                    total_tests += 1
                    missing_fields = [field for field in cred["expected_fields"] if field not in user_data]
                    
                    if not missing_fields:
                        self.log_test(f"URGENTE {cred['name']} Data Structure", True, 
                                     f"✅ Estrutura completa: {len(cred['expected_fields'])} campos presentes")
                    else:
                        self.log_test(f"URGENTE {cred['name']} Data Structure", False, 
                                     f"❌ Campos ausentes: {missing_fields}")
                    
                    # Test 4: Profile Access
                    print(f"   👤 TESTE 4: Acesso ao Perfil...")
                    total_tests += 1
                    profile_response = self.make_request("GET", "/user/profile", token=token)
                    
                    if profile_response.status_code == 200:
                        profile_data = profile_response.json()
                        cred_results["profile_accessible"] = True
                        self.log_test(f"URGENTE {cred['name']} Profile", True, 
                                     f"✅ Perfil acessível: {profile_data.get('full_name', 'N/A')}")
                    else:
                        self.log_test(f"URGENTE {cred['name']} Profile", False, 
                                     f"❌ Perfil inacessível - HTTP {profile_response.status_code}")
                    
                    # Test 5: Balance Access
                    print(f"   💰 TESTE 5: Verificação de Saldo...")
                    total_tests += 1
                    balance_response = self.make_request("GET", "/user/balance", token=token)
                    
                    if balance_response.status_code == 200:
                        balance_data = balance_response.json()
                        cred_results["balance_accessible"] = True
                        total_balance = balance_data.get('balance', 0) + balance_data.get('cashback_balance', 0)
                        self.log_test(f"URGENTE {cred['name']} Balance", True, 
                                     f"✅ Saldo: R$ {balance_data.get('balance', 0):.2f} + "
                                     f"R$ {balance_data.get('cashback_balance', 0):.2f} = R$ {total_balance:.2f}")
                    else:
                        self.log_test(f"URGENTE {cred['name']} Balance", False, 
                                     f"❌ Saldo inacessível - HTTP {balance_response.status_code}")
                    
                    # Test 6: Account-Specific Validations
                    if cred["type"] == "master":
                        print(f"   👑 TESTE 6: Validação Específica Master...")
                        total_tests += 1
                        if user_data.get("is_master_account"):
                            cred_results["specific_tests"]["master_flag"] = True
                            self.log_test(f"URGENTE {cred['name']} Master Flag", True, 
                                         "✅ is_master_account = true")
                        else:
                            cred_results["specific_tests"]["master_flag"] = False
                            self.log_test(f"URGENTE {cred['name']} Master Flag", False, 
                                         "❌ is_master_account deveria ser true")
                    
                    elif cred["type"] == "lojista":
                        print(f"   🏪 TESTE 6: Validação Específica Lojista...")
                        total_tests += 1
                        
                        # Check essential lojista fields
                        lojista_essentials = {
                            "company_name": user_data.get("company_name"),
                            "cnpj": user_data.get("cnpj"),
                            "cashback_rate": user_data.get("cashback_rate")
                        }
                        
                        missing_essentials = [k for k, v in lojista_essentials.items() if v is None]
                        
                        if not missing_essentials:
                            cred_results["specific_tests"]["lojista_essentials"] = True
                            self.log_test(f"URGENTE {cred['name']} Lojista Essentials", True, 
                                         f"✅ Dados essenciais: {lojista_essentials['company_name']}, "
                                         f"CNPJ: {lojista_essentials['cnpj']}, "
                                         f"Cashback: {lojista_essentials['cashback_rate']}%")
                        else:
                            cred_results["specific_tests"]["lojista_essentials"] = False
                            self.log_test(f"URGENTE {cred['name']} Lojista Essentials", False, 
                                         f"❌ Dados essenciais ausentes: {missing_essentials}")
                        
                        # Test QR Code generation
                        print(f"   💳 TESTE 7: Geração de QR Code...")
                        total_tests += 1
                        qr_request = {"amount": 25.00}
                        qr_response = self.make_request("POST", "/merchant/qr-code", qr_request, token=token)
                        
                        if qr_response.status_code == 200:
                            qr_data = qr_response.json()
                            cred_results["specific_tests"]["qr_generation"] = True
                            self.log_test(f"URGENTE {cred['name']} QR Generation", True, 
                                         f"✅ QR Code gerado: {qr_data.get('digital_code', 'N/A')}")
                        else:
                            cred_results["specific_tests"]["qr_generation"] = False
                            self.log_test(f"URGENTE {cred['name']} QR Generation", False, 
                                         f"❌ Falha na geração QR: HTTP {qr_response.status_code}")
                    
                    # Store token for cross-account testing
                    tokens[f"demo_{cred['type']}"] = token
                    
                else:
                    # Login failed - detailed error analysis
                    error_detail = response.text if response.text else "Sem detalhes"
                    
                    self.log_test(f"URGENTE {cred['name']} Login", False, 
                                 f"❌ LOGIN FALHOU - Status: {response.status_code}")
                    
                    print(f"   ❌ DIAGNÓSTICO DE ERRO:")
                    print(f"      • Status Code: {response.status_code}")
                    print(f"      • Detalhes: {error_detail}")
                    
                    if response.status_code == 401:
                        self.log_test(f"URGENTE {cred['name']} Error Analysis", False, 
                                     "❌ ERRO 401: Credenciais inválidas - Possível problema de hash bcrypt")
                        print(f"      • CAUSA PROVÁVEL: Hash da senha incorreto no banco de dados")
                        print(f"      • SOLUÇÃO: Recriar conta com hash bcrypt correto")
                        
                    elif response.status_code == 500:
                        self.log_test(f"URGENTE {cred['name']} Error Analysis", False, 
                                     "❌ ERRO 500: Erro interno do servidor - Problema no MongoDB")
                        print(f"      • CAUSA PROVÁVEL: Problema de conexão ou estrutura do banco")
                        print(f"      • SOLUÇÃO: Verificar MongoDB e estrutura da collection users")
                        
                    elif response.status_code == 404:
                        self.log_test(f"URGENTE {cred['name']} Error Analysis", False, 
                                     "❌ ERRO 404: Endpoint não encontrado - Problema de roteamento")
                        print(f"      • CAUSA PROVÁVEL: Rota /api/auth/login não configurada")
                        print(f"      • SOLUÇÃO: Verificar configuração do FastAPI")
                        
            except Exception as e:
                self.log_test(f"URGENTE {cred['name']} Connection", False, 
                             f"❌ ERRO DE CONEXÃO: {str(e)}")
                print(f"   ❌ ERRO DE CONEXÃO: {str(e)}")
                print(f"      • CAUSA PROVÁVEL: Backend não está rodando ou inacessível")
                print(f"      • SOLUÇÃO: Verificar se o backend está ativo na porta 8001")
            
            detailed_results[cred["type"]] = cred_results
        
        # Cross-account functionality test
        if successful_logins >= 2:
            print(f"\n🔄 TESTE CRUZADO: Funcionalidades entre contas...")
            
            # Test digital code validation if both cliente and lojista work
            if (tokens.get("demo_cliente") and tokens.get("demo_lojista")):
                print(f"   💳 Testando fluxo completo: Lojista gera QR → Cliente valida...")
                
                # Lojista generates QR
                lojista_token = tokens["demo_lojista"]
                qr_request = {"amount": 50.00}
                qr_response = self.make_request("POST", "/merchant/qr-code", qr_request, token=lojista_token)
                
                if qr_response.status_code == 200:
                    qr_data = qr_response.json()
                    digital_code = qr_data.get("digital_code")
                    
                    if digital_code:
                        # Cliente validates digital code
                        cliente_token = tokens["demo_cliente"]
                        validation_request = {"digital_code": digital_code}
                        validation_response = self.make_request("POST", "/transactions/validate-digital-code", 
                                                              validation_request)
                        
                        if validation_response.status_code == 200:
                            validation_data = validation_response.json()
                            self.log_test("URGENTE Cross-Account QR Flow", True, 
                                         f"✅ Fluxo completo funcionando - Lojista gera, Cliente valida")
                        else:
                            self.log_test("URGENTE Cross-Account QR Flow", False, 
                                         f"❌ Cliente não consegue validar código do lojista")
        
        # Final Diagnosis
        print(f"\n🎯 DIAGNÓSTICO FINAL URGENTE:")
        print(f"   • Contas testadas: {len(demo_credentials)}")
        print(f"   • Logins bem-sucedidos: {successful_logins}/{len(demo_credentials)}")
        print(f"   • Total de testes executados: {total_tests}")
        print(f"   • Taxa de sucesso: {(successful_logins/len(demo_credentials)*100):.1f}%")
        
        if successful_logins == len(demo_credentials):
            print("   ✅ RESULTADO: TODAS AS CONTAS DEMO ESTÃO FUNCIONANDO")
            print("   ✅ PROBLEMA REPORTADO: NÃO CONFIRMADO - Sistema operacional")
            print("   ✅ SISTEMA PRONTO PARA TESTES DE INTEGRAÇÃO XGATE")
        elif successful_logins > 0:
            print(f"   ⚠️ RESULTADO: PROBLEMA PARCIAL - {successful_logins}/{len(demo_credentials)} contas funcionando")
            print("   ⚠️ AÇÃO NECESSÁRIA: Corrigir contas que falharam")
            failed_accounts = [cred["name"] for cred in demo_credentials 
                             if not detailed_results.get(cred["type"], {}).get("login_success", False)]
            print(f"   ⚠️ CONTAS COM PROBLEMA: {', '.join(failed_accounts)}")
        else:
            print("   ❌ RESULTADO: PROBLEMA CRÍTICO CONFIRMADO")
            print("   ❌ NENHUMA CONTA DEMO FUNCIONA")
            print("   ❌ CAUSA MAIS PROVÁVEL:")
            print("     - Banco de dados MongoDB vazio ou corrompido")
            print("     - Hashes bcrypt das senhas incorretos")
            print("     - Backend não está conectado ao banco correto")
            print("   ❌ AÇÃO URGENTE: Recriar contas demo no banco de dados")
        
        return successful_logins, total_tests, detailed_results

if __name__ == "__main__":
    tester = DemoAccountTester()
    successful_logins, total_tests, results = tester.test_demo_accounts_urgent()
    
    # Exit with appropriate code
    if successful_logins == 3:
        sys.exit(0)  # All accounts working
    elif successful_logins > 0:
        sys.exit(1)  # Partial success
    else:
        sys.exit(2)  # Complete failure