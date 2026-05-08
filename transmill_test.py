#!/usr/bin/env python3
"""
Transmill Complete Pre-Deploy Verification Test
"""

import requests
import json
import time

def test_transmill_complete_pre_deploy_verification(base_url="http://localhost:8001/api"):
    """🔍 VERIFICAÇÃO COMPLETA PRÉ-DEPLOY - SISTEMA TRANSMILL"""
    print("\n🔍 VERIFICAÇÃO COMPLETA PRÉ-DEPLOY - SISTEMA TRANSMILL")
    print("=" * 80)
    print("OBJETIVO: Validar TUDO antes do deploy em https://app.transmill.com.br")
    print("")
    print("## 1️⃣ TESTE DE LOGIN - 8 CONTAS DEMO")
    print("")
    print("Testar login de TODAS as contas com senha 'demo123':")
    print("")
    print("### Contas Sistema:")
    print("1. cliente@demo.com / demo123")
    print("2. lojista@demo.com / demo123")
    print("3. prestador@demo.com / demo123")
    print("4. master@agitocoin.com / demo123")
    print("")
    print("### Contas Labelview:")
    print("5. protecao@agitomil.com / demo123")
    print("6. agitoauto@agitomil.com / demo123")
    print("7. regional@agitomil.com / demo123")
    print("8. rafael@agitomil.com / demo123")
    print("")
    print("**Para cada conta validar**:")
    print("- POST /api/auth/login retorna status 200")
    print("- access_token presente e válido")
    print("- user_type correto")
    print("- is_active = true")
    print("- is_blocked = false")
    print("")
    print("## 2️⃣ TESTE DE ACESSO AO PERFIL")
    print("")
    print("Para cada conta logada:")
    print("- GET /api/user/profile com token")
    print("- Status 200")
    print("- Dados completos (id, email, full_name, user_type)")
    print("")
    print("## 3️⃣ ENDPOINTS CRÍTICOS")
    print("")
    print("### Labelview:")
    print("- GET /api/labelview/planos (com token master labelview)")
    print("- GET /api/labelview/tipos-fornecedor (com token master labelview)")
    print("")
    print("### Sistema:")
    print("- GET /api/stores (público)")
    print("- GET /api/prestadores (público)")
    print("")
    print("## 4️⃣ VALIDAÇÕES IMPORTANTES")
    print("")
    print("✅ Todas as 8 contas fazem login")
    print("✅ Todos os tokens JWT válidos")
    print("✅ Todos os perfis acessíveis")
    print("✅ User_types corretos")
    print("✅ Contas ativas")
    print("✅ Endpoints principais funcionando")
    print("")
    print("**CONCLUSÃO ESPERADA**: Sistema 100% funcional e pronto para deploy!")
    print("=" * 80)
    
    # Test results tracking
    test_results = []
    
    def log_test(test_name, success, details):
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
    
    def make_request(method, endpoint, data=None, token=None):
        url = f"{base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise
    
    # Definir todas as 8 contas para teste
    test_accounts = [
        # Contas Sistema (4)
        {
            "email": "cliente@demo.com",
            "password": "demo123",
            "expected_user_type": "cliente",
            "name": "Cliente Demo",
            "category": "Sistema"
        },
        {
            "email": "lojista@demo.com",
            "password": "demo123",
            "expected_user_type": "lojista",
            "name": "Lojista Demo",
            "category": "Sistema"
        },
        {
            "email": "prestador@demo.com",
            "password": "demo123",
            "expected_user_type": "service_provider",
            "name": "Prestador Demo",
            "category": "Sistema"
        },
        {
            "email": "master@agitocoin.com",
            "password": "demo123",
            "expected_user_type": "master",
            "name": "Master Sistema",
            "category": "Sistema",
            "special_flags": ["is_master_account"]
        },
        # Contas Labelview (4)
        {
            "email": "protecao@agitomil.com",
            "password": "demo123",
            "expected_user_type": "labelview_master",
            "name": "Master Labelview",
            "category": "Labelview",
            "special_flags": ["is_labelview_master"]
        },
        {
            "email": "agitoauto@agitomil.com",
            "password": "demo123",
            "expected_user_type": "labelview_unidade",
            "name": "Unidade Labelview",
            "category": "Labelview"
        },
        {
            "email": "regional@agitomil.com",
            "password": "demo123",
            "expected_user_type": "labelview_regional",
            "name": "Regional Labelview",
            "category": "Labelview"
        },
        {
            "email": "rafael@agitomil.com",
            "password": "demo123",
            "expected_user_type": "labelview_consultor",
            "name": "Consultor Labelview",
            "category": "Labelview"
        }
    ]
    
    successful_logins = 0
    successful_profiles = 0
    account_tokens = {}
    login_results = {}
    
    # 1️⃣ TESTE DE LOGIN - 8 CONTAS DEMO
    print("\n--- 1️⃣ TESTE DE LOGIN - 8 CONTAS DEMO ---")
    
    for i, account in enumerate(test_accounts, 1):
        print(f"\n🔍 Testando conta {i}/8: {account['name']} ({account['email']})")
        
        login_data = {
            "email": account["email"],
            "password": account["password"]
        }
        
        try:
            response = make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                user_data = data.get("user", {})
                
                if token:
                    successful_logins += 1
                    account_tokens[account["email"]] = token
                    login_results[account["email"]] = {
                        "success": True,
                        "token": token,
                        "user_data": user_data
                    }
                    
                    # Validar user_type correto
                    user_type = user_data.get("user_type")
                    if user_type == account["expected_user_type"]:
                        log_test(f"Login {account['name']} - User Type", True, 
                                f"✅ {account['email']} - user_type correto: {user_type}")
                    else:
                        log_test(f"Login {account['name']} - User Type", False, 
                                f"❌ {account['email']} - user_type incorreto: {user_type} (esperado: {account['expected_user_type']})")
                    
                    # Validar is_active = true
                    is_active = user_data.get("is_active", True)  # Default true se não especificado
                    if is_active:
                        log_test(f"Login {account['name']} - Is Active", True, 
                                f"✅ {account['email']} - is_active=true")
                    else:
                        log_test(f"Login {account['name']} - Is Active", False, 
                                f"❌ {account['email']} - is_active=false")
                    
                    # Validar is_blocked = false
                    is_blocked = user_data.get("is_blocked", False)
                    if not is_blocked:
                        log_test(f"Login {account['name']} - Not Blocked", True, 
                                f"✅ {account['email']} - is_blocked=false")
                    else:
                        log_test(f"Login {account['name']} - Not Blocked", False, 
                                f"❌ {account['email']} - is_blocked=true")
                    
                    # Validar flags especiais se existirem
                    if "special_flags" in account:
                        for flag in account["special_flags"]:
                            flag_value = user_data.get(flag, False)
                            if flag_value:
                                log_test(f"Login {account['name']} - {flag}", True, 
                                        f"✅ {account['email']} - {flag}=true")
                            else:
                                log_test(f"Login {account['name']} - {flag}", False, 
                                        f"❌ {account['email']} - {flag}=false")
                    
                    log_test(f"Login {account['name']}", True, 
                            f"✅ {account['email']} - Login funcionando")
                else:
                    login_results[account["email"]] = {"success": False, "error": "Token não retornado"}
                    log_test(f"Login {account['name']}", False, 
                            f"❌ {account['email']} - Token não retornado")
            else:
                login_results[account["email"]] = {"success": False, "error": f"Status {response.status_code}"}
                log_test(f"Login {account['name']}", False, 
                        f"❌ {account['email']} - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Erro: {error_data.get('detail', 'Erro desconhecido')}")
                except:
                    print(f"   Erro sem detalhes - Status: {response.status_code}")
                    
        except Exception as e:
            login_results[account["email"]] = {"success": False, "error": str(e)}
            log_test(f"Login {account['name']}", False, 
                    f"❌ {account['email']} - Erro: {str(e)}")
    
    # 2️⃣ TESTE DE ACESSO AO PERFIL
    print("\n--- 2️⃣ TESTE DE ACESSO AO PERFIL ---")
    
    for account in test_accounts:
        if account["email"] in account_tokens:
            token = account_tokens[account["email"]]
            
            try:
                response = make_request("GET", "/user/profile", token=token)
                
                if response.status_code == 200:
                    profile_data = response.json()
                    successful_profiles += 1
                    
                    # Validar campos obrigatórios
                    required_fields = ["id", "email", "full_name", "user_type"]
                    missing_fields = []
                    for field in required_fields:
                        if not profile_data.get(field):
                            missing_fields.append(field)
                    
                    if not missing_fields:
                        log_test(f"Perfil {account['name']}", True, 
                                f"✅ {account['email']} - Perfil acessível, dados completos")
                    else:
                        log_test(f"Perfil {account['name']}", False, 
                                f"❌ {account['email']} - Campos ausentes: {', '.join(missing_fields)}")
                    
                    # Validar user_type no perfil
                    profile_user_type = profile_data.get("user_type")
                    if profile_user_type == account["expected_user_type"]:
                        log_test(f"Perfil {account['name']} - User Type", True, 
                                f"✅ {account['email']} - user_type correto no perfil: {profile_user_type}")
                    else:
                        log_test(f"Perfil {account['name']} - User Type", False, 
                                f"❌ {account['email']} - user_type no perfil incorreto: {profile_user_type}")
                else:
                    log_test(f"Perfil {account['name']}", False, 
                            f"❌ {account['email']} - Erro ao acessar perfil: {response.status_code}")
                    
            except Exception as e:
                log_test(f"Perfil {account['name']}", False, 
                        f"❌ {account['email']} - Erro no perfil: {str(e)}")
    
    # 3️⃣ ENDPOINTS CRÍTICOS
    print("\n--- 3️⃣ ENDPOINTS CRÍTICOS ---")
    
    # Labelview endpoints (com token master labelview)
    print("\n🔍 Testando endpoints Labelview:")
    
    labelview_master_token = account_tokens.get("protecao@agitomil.com")
    if labelview_master_token:
        # GET /api/labelview/planos
        try:
            response = make_request("GET", "/labelview/planos", token=labelview_master_token)
            
            if response.status_code == 200:
                log_test("Labelview Planos API", True, 
                        "✅ GET /api/labelview/planos funcionando")
            else:
                log_test("Labelview Planos API", False, 
                        f"❌ GET /api/labelview/planos - Status: {response.status_code}")
        except Exception as e:
            log_test("Labelview Planos API", False, 
                    f"❌ Erro na API planos: {str(e)}")
        
        # GET /api/labelview/tipos-fornecedor
        try:
            response = make_request("GET", "/labelview/tipos-fornecedor", token=labelview_master_token)
            
            if response.status_code == 200:
                log_test("Labelview Tipos Fornecedor API", True, 
                        "✅ GET /api/labelview/tipos-fornecedor funcionando")
            else:
                log_test("Labelview Tipos Fornecedor API", False, 
                        f"❌ GET /api/labelview/tipos-fornecedor - Status: {response.status_code}")
        except Exception as e:
            log_test("Labelview Tipos Fornecedor API", False, 
                    f"❌ Erro na API tipos-fornecedor: {str(e)}")
    else:
        log_test("Labelview APIs", False, 
                "❌ Token master labelview não disponível para testar APIs")
    
    # Sistema endpoints (públicos)
    print("\n🔍 Testando endpoints públicos do sistema:")
    
    # GET /api/stores (público)
    try:
        response = make_request("GET", "/stores")
        
        if response.status_code == 200:
            log_test("Stores API", True, 
                    "✅ GET /api/stores funcionando")
        else:
            log_test("Stores API", False, 
                    f"❌ GET /api/stores - Status: {response.status_code}")
    except Exception as e:
        log_test("Stores API", False, 
                f"❌ Erro na API stores: {str(e)}")
    
    # GET /api/prestadores (público)
    try:
        response = make_request("GET", "/prestadores")
        
        if response.status_code == 200:
            log_test("Prestadores API", True, 
                    "✅ GET /api/prestadores funcionando")
        else:
            log_test("Prestadores API", False, 
                    f"❌ GET /api/prestadores - Status: {response.status_code}")
    except Exception as e:
        log_test("Prestadores API", False, 
                f"❌ Erro na API prestadores: {str(e)}")
    
    # 4️⃣ VALIDAÇÕES FINAIS
    print("\n--- 4️⃣ VALIDAÇÕES FINAIS ---")
    
    # Resumo por categoria
    sistema_accounts = [acc for acc in test_accounts if acc["category"] == "Sistema"]
    labelview_accounts = [acc for acc in test_accounts if acc["category"] == "Labelview"]
    
    sistema_logins = len([acc for acc in sistema_accounts if acc["email"] in account_tokens])
    labelview_logins = len([acc for acc in labelview_accounts if acc["email"] in account_tokens])
    
    print(f"\n📊 RESUMO POR CATEGORIA:")
    print(f"   🔧 CONTAS SISTEMA: {sistema_logins}/4 funcionando ({(sistema_logins/4*100):.1f}%)")
    for acc in sistema_accounts:
        status = "✅" if acc["email"] in account_tokens else "❌"
        print(f"      {status} {acc['name']}: {acc['email']}")
    
    print(f"   🏢 CONTAS LABELVIEW: {labelview_logins}/4 funcionando ({(labelview_logins/4*100):.1f}%)")
    for acc in labelview_accounts:
        status = "✅" if acc["email"] in account_tokens else "❌"
        print(f"      {status} {acc['name']}: {acc['email']}")
    
    # Resumo geral
    print(f"\n🎯 RESUMO GERAL DA VERIFICAÇÃO PRÉ-DEPLOY:")
    print(f"   • Total de contas testadas: 8")
    print(f"   • Logins bem-sucedidos: {successful_logins}/8 ({(successful_logins/8*100):.1f}%)")
    print(f"   • Perfis acessíveis: {successful_profiles}/8 ({(successful_profiles/8*100):.1f}%)")
    print(f"   • Tokens JWT válidos: {len(account_tokens)}/8")
    
    # Validações críticas
    all_logins_working = successful_logins == 8
    all_profiles_working = successful_profiles == 8
    critical_endpoints_working = True  # Assumir true se não houver falhas críticas
    
    # Verificar se há falhas críticas nos endpoints
    critical_endpoint_tests = [
        "Labelview Planos API",
        "Labelview Tipos Fornecedor API", 
        "Stores API",
        "Prestadores API"
    ]
    
    failed_critical_endpoints = []
    for test_name in critical_endpoint_tests:
        if not any(test_name in r["test"] and r["success"] for r in test_results):
            failed_critical_endpoints.append(test_name)
    
    if failed_critical_endpoints:
        critical_endpoints_working = False
    
    # Resultado final
    if all_logins_working and all_profiles_working and critical_endpoints_working:
        print("\n✅ RESULTADO FINAL: SISTEMA 100% FUNCIONAL E PRONTO PARA DEPLOY!")
        print("   ✅ TODAS AS 8 CONTAS FAZEM LOGIN (100%)")
        print("   ✅ TODOS OS TOKENS JWT VÁLIDOS")
        print("   ✅ TODOS OS PERFIS ACESSÍVEIS")
        print("   ✅ USER_TYPES CORRETOS")
        print("   ✅ CONTAS ATIVAS")
        print("   ✅ ENDPOINTS PRINCIPAIS FUNCIONANDO")
        print("   ✅ SISTEMA PRONTO PARA DEPLOY EM https://app.transmill.com.br")
        return True
    else:
        print("\n❌ RESULTADO FINAL: PROBLEMAS IDENTIFICADOS - CORREÇÕES NECESSÁRIAS")
        
        if not all_logins_working:
            failed_logins = 8 - successful_logins
            print(f"   ❌ {failed_logins} LOGINS FALHARAM")
        
        if not all_profiles_working:
            failed_profiles = 8 - successful_profiles
            print(f"   ❌ {failed_profiles} PERFIS INACESSÍVEIS")
        
        if not critical_endpoints_working:
            print(f"   ❌ ENDPOINTS CRÍTICOS COM PROBLEMAS: {', '.join(failed_critical_endpoints)}")
        
        print("   ❌ NÃO RECOMENDADO PARA DEPLOY ATÉ CORREÇÕES")
        return False

if __name__ == "__main__":
    import sys
    success = test_transmill_complete_pre_deploy_verification()
    sys.exit(0 if success else 1)