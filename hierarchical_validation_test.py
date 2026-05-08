#!/usr/bin/env python3
"""
🎯 TESTE DE VALIDAÇÃO - Verificar se problema de duplicação hierárquica foi resolvido

OBJETIVO:
Validar se a correção dos dados hierárquicos resolveu o problema de duplicação reportado pelo usuário

TESTE ESPECÍFICO:
1. TESTAR API HIERÁRQUICA:
   - Login com master@agitocoin.com / master123
   - Chamar GET /api/master/hierarchical-users
   - Verificar se retorna exatamente 3 usuários únicos
   - Confirmar que não há mais duplicação

2. VALIDAR DADOS CORRETOS:
   Deve retornar apenas:
   - Sócio Operador: socio.operador@agitocoin.com - Carlos Silva Operador (ATIVO)
   - Mini Agência: mini.agencia@agitocoin.com - Maria Santos Agência (ATIVO)  
   - Consultor: consultor@agitocoin.com - João Costa Consultor (ATIVO)

3. VERIFICAÇÕES CRÍTICAS:
   - Nenhuma duplicação por email
   - Nenhuma duplicação por ID
   - Todos os usuários com is_active=true
   - Exatamente 3 registros únicos

URL DE TESTE: https://test-auth-fix-1.emergent.host/api
"""

import requests
import json
import time

class HierarchicalValidationTester:
    def __init__(self):
        self.base_url = "https://test-auth-fix-1.emergent.host/api"
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_hierarchical_duplication_validation(self):
        """🎯 TESTE DE VALIDAÇÃO - Verificar se problema de duplicação hierárquica foi resolvido"""
        print("\n🎯 TESTE DE VALIDAÇÃO - VERIFICAR SE PROBLEMA DE DUPLICAÇÃO HIERÁRQUICA FOI RESOLVIDO")
        print("=" * 80)
        print("OBJETIVO:")
        print("- Validar se a correção dos dados hierárquicos resolveu o problema de duplicação reportado pelo usuário")
        print("")
        print("RESULTADO ESPERADO:")
        print("- API retorna 3 usuários únicos")
        print("- Nenhuma duplicação detectada")
        print("- Todos usuários ativos")
        print("- Problema reportado pelo usuário resolvido")
        print("=" * 80)
        
        # Test 1: Login with master account
        print("\n--- TESTE 1: Login Master Account ---")
        
        master_login_data = {
            "email": "master@agitocoin.com",
            "password": "master123"
        }
        
        response = self.make_request("POST", "/auth/login", master_login_data)
        
        if response.status_code == 200:
            data = response.json()
            master_token = data["access_token"]
            master_user = data["user"]
            
            self.log_test("Master Login", True, 
                         f"✅ Login master funcionando - {master_user.get('full_name', 'Master')}")
            
            # Verify master account flag
            if master_user.get("is_master_account", False):
                self.log_test("Master Account Verification", True, 
                             "✅ is_master_account = true confirmado")
            else:
                self.log_test("Master Account Verification", False, 
                             "❌ is_master_account deveria ser true")
                
        else:
            self.log_test("Master Login", False, 
                         f"❌ Login master falhou - Status: {response.status_code}")
            print("❌ ERRO CRÍTICO: Não é possível continuar validação sem acesso master")
            return False
        
        # Test 2: Test hierarchical users API - VALIDAÇÃO ESPECÍFICA
        print("\n--- TESTE 2: API Hierárquica - GET /api/master/hierarchical-users ---")
        
        response = self.make_request("GET", "/master/hierarchical-users", token=master_token)
        
        hierarchical_users = []
        validation_passed = True
        
        if response.status_code == 200:
            response_data = response.json()
            hierarchical_users = response_data.get("users", [])
            
            # VALIDAÇÃO CRÍTICA 1: Deve retornar exatamente 3 usuários
            if len(hierarchical_users) == 3:
                self.log_test("Hierarchical Users Count", True, 
                             f"✅ API retorna exatamente 3 usuários hierárquicos (correto)")
            else:
                self.log_test("Hierarchical Users Count", False, 
                             f"❌ API retorna {len(hierarchical_users)} usuários - Esperado: 3")
                validation_passed = False
            
            # VALIDAÇÃO CRÍTICA 2: Nenhuma duplicação por email
            emails = [user.get('email', '') for user in hierarchical_users]
            unique_emails = set(emails)
            
            if len(emails) == len(unique_emails):
                self.log_test("No Email Duplication", True, 
                             "✅ Nenhuma duplicação por email detectada")
            else:
                duplicate_emails = {}
                for email in emails:
                    count = emails.count(email)
                    if count > 1:
                        duplicate_emails[email] = count
                
                self.log_test("No Email Duplication", False, 
                             f"❌ DUPLICAÇÃO POR EMAIL DETECTADA: {duplicate_emails}")
                validation_passed = False
            
            # VALIDAÇÃO CRÍTICA 3: Nenhuma duplicação por ID
            ids = [user.get('id', '') for user in hierarchical_users]
            unique_ids = set(ids)
            
            if len(ids) == len(unique_ids):
                self.log_test("No ID Duplication", True, 
                             "✅ Nenhuma duplicação por ID detectada")
            else:
                duplicate_ids = {}
                for user_id in ids:
                    count = ids.count(user_id)
                    if count > 1:
                        duplicate_ids[user_id] = count
                
                self.log_test("No ID Duplication", False, 
                             f"❌ DUPLICAÇÃO POR ID DETECTADA: {duplicate_ids}")
                validation_passed = False
            
            # VALIDAÇÃO CRÍTICA 4: Verificar contas específicas esperadas
            expected_accounts = [
                {"email": "socio.operador@agitocoin.com", "name": "Carlos Silva Operador", "role": "socio_operador"},
                {"email": "mini.agencia@agitocoin.com", "name": "Maria Santos Agência", "role": "mini_agencia"},
                {"email": "consultor@agitocoin.com", "name": "João Costa Consultor", "role": "consultor"}
            ]
            
            print(f"\n🔍 VERIFICAÇÃO DAS CONTAS ESPECÍFICAS ESPERADAS:")
            found_accounts = 0
            
            for expected in expected_accounts:
                found_users = [u for u in hierarchical_users if u.get('email') == expected['email']]
                
                if len(found_users) == 1:
                    user = found_users[0]
                    is_active = not user.get('is_blocked', False)  # is_active is opposite of is_blocked
                    
                    if is_active:
                        self.log_test(f"Expected Account - {expected['email']}", True, 
                                     f"✅ CONTA ENCONTRADA E ATIVA: {user.get('full_name', 'N/A')} - {user.get('hierarchical_role', 'N/A')}")
                        found_accounts += 1
                    else:
                        self.log_test(f"Expected Account - {expected['email']}", False, 
                                     f"❌ CONTA ENCONTRADA MAS INATIVA: {user.get('full_name', 'N/A')}")
                        validation_passed = False
                        
                elif len(found_users) == 0:
                    self.log_test(f"Expected Account - {expected['email']}", False, 
                                 f"❌ CONTA AUSENTE: {expected['email']} - {expected['name']}")
                    validation_passed = False
                else:
                    self.log_test(f"Expected Account - {expected['email']}", False, 
                                 f"❌ DUPLICAÇÃO DETECTADA: {expected['email']} encontrado {len(found_users)} vezes")
                    validation_passed = False
            
            # VALIDAÇÃO CRÍTICA 5: Todos os usuários devem estar ativos
            inactive_users = [u for u in hierarchical_users if u.get('is_blocked', False)]
            
            if len(inactive_users) == 0:
                self.log_test("All Users Active", True, 
                             "✅ Todos os usuários hierárquicos estão ativos")
            else:
                self.log_test("All Users Active", False, 
                             f"❌ {len(inactive_users)} usuários inativos encontrados")
                validation_passed = False
            
            # VALIDAÇÃO CRÍTICA 6: Contadores de funções corretos (1 de cada)
            roles = [user.get('hierarchical_role', '') for user in hierarchical_users]
            role_counts = {}
            for role in roles:
                role_counts[role] = role_counts.get(role, 0) + 1
            
            expected_roles = ["socio_operador", "mini_agencia", "consultor"]
            role_validation_passed = True
            
            print(f"\n📊 VALIDAÇÃO DOS CONTADORES DE FUNÇÕES:")
            for role in expected_roles:
                count = role_counts.get(role, 0)
                if count == 1:
                    self.log_test(f"Role Count - {role}", True, 
                                 f"✅ {role}: {count} usuário (correto)")
                else:
                    self.log_test(f"Role Count - {role}", False, 
                                 f"❌ {role}: {count} usuários (esperado: 1)")
                    role_validation_passed = False
                    validation_passed = False
            
            if role_validation_passed:
                self.log_test("Role Distribution Validation", True, 
                             "✅ Distribuição de funções hierárquicas correta (1 de cada)")
            else:
                self.log_test("Role Distribution Validation", False, 
                             "❌ Distribuição de funções hierárquicas incorreta")
            
        else:
            self.log_test("Hierarchical Users API", False, 
                         f"❌ API inacessível - Status: {response.status_code}")
            print("❌ ERRO CRÍTICO: Não é possível acessar API hierárquica")
            return False
        
        # Test 3: Análise detalhada dos dados encontrados
        print("\n--- TESTE 3: Análise Detalhada dos Dados Encontrados ---")
        
        print(f"\n📋 ANÁLISE DETALHADA DOS {len(hierarchical_users)} USUÁRIOS ENCONTRADOS:")
        
        # Group by email domain to identify old vs new accounts
        agitocoin_users = [u for u in hierarchical_users if '@agitocoin.com' in u.get('email', '')]
        agitocash_users = [u for u in hierarchical_users if '@agitocash.com' in u.get('email', '')]
        
        print(f"\n📧 USUÁRIOS POR DOMÍNIO:")
        print(f"   • @agitocoin.com (NOVOS): {len(agitocoin_users)} usuários")
        print(f"   • @agitocash.com (ANTIGOS): {len(agitocash_users)} usuários")
        
        if len(agitocash_users) > 0:
            self.log_test("Old Domain Users Found", False, 
                         f"❌ ENCONTRADOS {len(agitocash_users)} usuários com domínio antigo @agitocash.com")
            validation_passed = False
        else:
            self.log_test("Old Domain Users Found", True, 
                         "✅ Nenhum usuário com domínio antigo @agitocash.com encontrado")
        
        for i, user in enumerate(hierarchical_users, 1):
            user_email = user.get('email', 'N/A')
            user_name = user.get('full_name', 'N/A')
            user_role = user.get('hierarchical_role', 'N/A')
            user_id = user.get('id', 'N/A')
            is_active = not user.get('is_blocked', False)
            created_at = user.get('created_at', 'N/A')
            
            status_icon = "✅" if is_active else "❌"
            domain_icon = "🆕" if '@agitocoin.com' in user_email else "🔴"
            
            print(f"   {status_icon} {domain_icon} Usuário {i}:")
            print(f"      📧 Email: {user_email}")
            print(f"      👤 Nome: {user_name}")
            print(f"      🏢 Função: {user_role}")
            print(f"      🆔 ID: {user_id}")
            print(f"      ✅ Ativo: {is_active}")
            print(f"      📅 Criado: {created_at}")
            print("")
        
        # Final Summary - RESULTADO DA VALIDAÇÃO
        print(f"\n🎯 RESULTADO FINAL DA VALIDAÇÃO DE DUPLICAÇÃO HIERÁRQUICA:")
        print(f"   • Total de usuários hierárquicos: {len(hierarchical_users)}")
        print(f"   • Usuários únicos por email: {len(set(user.get('email', '') for user in hierarchical_users))}")
        print(f"   • Usuários únicos por ID: {len(set(user.get('id', '') for user in hierarchical_users))}")
        print(f"   • Usuários ativos: {len([u for u in hierarchical_users if not u.get('is_blocked', False)])}")
        print(f"   • Usuários @agitocoin.com: {len(agitocoin_users)}")
        print(f"   • Usuários @agitocash.com: {len(agitocash_users)}")
        
        if validation_passed and len(hierarchical_users) == 3:
            print("   ✅ RESULTADO: PROBLEMA DE DUPLICAÇÃO HIERÁRQUICA RESOLVIDO")
            print("   ✅ VALIDAÇÃO COMPLETA: Sistema retorna exatamente 3 usuários únicos e ativos")
            print("   ✅ CONTAS ESPERADAS: Todas as contas hierárquicas estão presentes e corretas")
            print("   ✅ INTEGRIDADE: Nenhuma duplicação detectada por email ou ID")
            print("   ✅ STATUS: Sistema hierárquico funcionando corretamente")
            print("   ✅ CORREÇÃO VALIDADA: Problema reportado pelo usuário foi resolvido")
        else:
            print("   ❌ RESULTADO: PROBLEMA DE DUPLICAÇÃO HIERÁRQUICA AINDA EXISTE")
            print("   ❌ VALIDAÇÃO FALHOU: Sistema não atende aos critérios esperados")
            
            if len(hierarchical_users) != 3:
                print(f"   ❌ QUANTIDADE INCORRETA: {len(hierarchical_users)} usuários (esperado: 3)")
            
            if len(agitocash_users) > 0:
                print(f"   ❌ DUPLICAÇÃO CONFIRMADA: {len(agitocash_users)} usuários antigos (@agitocash.com) ainda existem")
                print("   🚨 AÇÃO NECESSÁRIA: Remover usuários antigos e manter apenas os novos (@agitocoin.com)")
            
            if not validation_passed:
                print("   ❌ PROBLEMAS DETECTADOS: Duplicação ou dados incorretos encontrados")
        
        return validation_passed and len(hierarchical_users) == 3

if __name__ == "__main__":
    print("🎯 TESTE DE VALIDAÇÃO - DUPLICAÇÃO HIERÁRQUICA RESOLVIDA")
    print("=" * 60)
    
    # Initialize tester
    tester = HierarchicalValidationTester()
    print(f"🌐 URL Base: {tester.base_url}")
    print("")
    
    # Run specific validation test
    try:
        validation_result = tester.test_hierarchical_duplication_validation()
        
    except KeyboardInterrupt:
        print("\n⚠️ Teste interrompido pelo usuário")
        validation_result = False
    except Exception as e:
        print(f"\n❌ Erro durante execução do teste: {str(e)}")
        import traceback
        traceback.print_exc()
        validation_result = False
    
    # Print final summary
    print(f"\n" + "=" * 80)
    print("📊 RESULTADO FINAL DA VALIDAÇÃO")
    print("=" * 80)
    
    total_tests = len(tester.test_results)
    successful_tests = len([r for r in tester.test_results if r["success"]])
    failed_tests = total_tests - successful_tests
    success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
    
    print(f"📈 Total de testes executados: {total_tests}")
    print(f"✅ Testes bem-sucedidos: {successful_tests}")
    print(f"❌ Testes falharam: {failed_tests}")
    print(f"📊 Taxa de sucesso: {success_rate:.1f}%")
    
    if validation_result:
        print("🎉 RESULTADO: PROBLEMA DE DUPLICAÇÃO HIERÁRQUICA RESOLVIDO")
        print("✅ VALIDAÇÃO COMPLETA: Sistema retorna exatamente 3 usuários únicos")
        print("✅ CORREÇÃO CONFIRMADA: Dados hierárquicos estão corretos")
    else:
        print("🚨 RESULTADO: PROBLEMA DE DUPLICAÇÃO HIERÁRQUICA AINDA EXISTE")
        print("❌ VALIDAÇÃO FALHOU: Sistema não atende aos critérios esperados")
        print("❌ CORREÇÃO NECESSÁRIA: Dados hierárquicos precisam ser corrigidos")
    
    print("=" * 80)