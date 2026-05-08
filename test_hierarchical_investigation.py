#!/usr/bin/env python3
"""
Hierarchical Data Duplication Investigation
Specific test for the reported hierarchical data duplication issue
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class HierarchicalInvestigator:
    def __init__(self):
        # Use the correct URL from frontend .env
        self.base_url = "https://test-auth-fix-1.emergent.host/api"
        self.session = requests.Session()
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

    def investigate_hierarchical_duplication(self):
        """🚨 INVESTIGAÇÃO URGENTE - Problema de duplicação de dados hierárquicos reportado pelo usuário"""
        print("\n🚨 INVESTIGAÇÃO URGENTE - PROBLEMA DE DUPLICAÇÃO DE DADOS HIERÁRQUICOS")
        print("=" * 80)
        print("PROBLEMA REPORTADO:")
        print("- Usuário relatou que os dados das contas hierárquicas estão duplicados")
        print("- Necessária verificação e correção dos dados")
        print("")
        print("INVESTIGAÇÃO NECESSÁRIA:")
        print("1. VERIFICAR BANCO DE DADOS:")
        print("   - Verificar se há contas hierárquicas duplicadas no MongoDB")
        print("   - Analisar estrutura dos dados e identificar inconsistências")
        print("   - Contar registros por email, ID e função hierárquica")
        print("")
        print("2. TESTAR API HIERÁRQUICA:")
        print("   - GET /api/master/hierarchical-users")
        print("   - Verificar se API está retornando dados duplicados")
        print("   - Analisar resposta JSON para identificar problemas")
        print("")
        print("3. TESTAR DASHBOARD MASTER:")
        print("   - Login com master@agitocoin.com / master123")
        print("   - Acessar aba 'Hierarquia'")
        print("   - Verificar se interface mostra dados duplicados")
        print("")
        print("4. CONTAS HIERÁRQUICAS ESPERADAS:")
        print("   Devem existir apenas 3 contas únicas:")
        print("   - Sócio Operador: socio.operador@agitocoin.com - Carlos Silva Operador")
        print("   - Mini Agência: mini.agencia@agitocoin.com - Maria Santos Agência")
        print("   - Consultor: consultor@agitocoin.com - João Costa Consultor")
        print("")
        print("5. VERIFICAÇÕES DE DUPLICAÇÃO:")
        print("   - Verificar múltiplos registros com mesmo email")
        print("   - Verificar múltiplos registros com mesmo ID")
        print("   - Verificar se há registros com dados inconsistentes")
        print("")
        print("IMPORTANTE: Se encontrar duplicação, NÃO corrigir ainda - apenas reportar")
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
            print("❌ ERRO CRÍTICO: Não é possível continuar investigação sem acesso master")
            return False
        
        # Test 2: Test hierarchical users API
        print("\n--- TESTE 2: API Hierárquica - GET /api/master/hierarchical-users ---")
        
        response = self.make_request("GET", "/master/hierarchical-users", token=master_token)
        
        hierarchical_users = []
        api_duplicates_found = False
        
        if response.status_code == 200:
            response_data = response.json()
            
            # Handle different response formats
            if isinstance(response_data, list):
                hierarchical_users = response_data
            elif isinstance(response_data, dict) and 'users' in response_data:
                hierarchical_users = response_data['users']
            else:
                hierarchical_users = []
            
            self.log_test("Hierarchical Users API", True, 
                         f"✅ API acessível - Retornou {len(hierarchical_users)} usuários hierárquicos")
            
            # Analyze for duplicates by email
            emails = [user.get('email', '') if isinstance(user, dict) else '' for user in hierarchical_users]
            email_counts = {}
            for email in emails:
                email_counts[email] = email_counts.get(email, 0) + 1
            
            duplicate_emails = {email: count for email, count in email_counts.items() if count > 1}
            
            if duplicate_emails:
                api_duplicates_found = True
                self.log_test("API Duplicate Emails", False, 
                             f"❌ DUPLICAÇÃO ENCONTRADA POR EMAIL: {duplicate_emails}")
                for email, count in duplicate_emails.items():
                    print(f"      📧 {email}: {count} registros")
            else:
                self.log_test("API Duplicate Emails", True, 
                             "✅ Nenhuma duplicação por email encontrada na API")
            
            # Analyze for duplicates by ID
            ids = [user.get('id', '') if isinstance(user, dict) else '' for user in hierarchical_users]
            id_counts = {}
            for user_id in ids:
                id_counts[user_id] = id_counts.get(user_id, 0) + 1
            
            duplicate_ids = {user_id: count for user_id, count in id_counts.items() if count > 1}
            
            if duplicate_ids:
                api_duplicates_found = True
                self.log_test("API Duplicate IDs", False, 
                             f"❌ DUPLICAÇÃO ENCONTRADA POR ID: {len(duplicate_ids)} IDs duplicados")
                for user_id, count in duplicate_ids.items():
                    print(f"      🆔 {user_id}: {count} registros")
            else:
                self.log_test("API Duplicate IDs", True, 
                             "✅ Nenhuma duplicação por ID encontrada na API")
            
            # Analyze hierarchical roles
            roles = [user.get('hierarchical_role', '') if isinstance(user, dict) else '' for user in hierarchical_users]
            role_counts = {}
            for role in roles:
                role_counts[role] = role_counts.get(role, 0) + 1
            
            print(f"\n📊 DISTRIBUIÇÃO POR FUNÇÃO HIERÁRQUICA:")
            for role, count in role_counts.items():
                print(f"   • {role}: {count} usuário(s)")
                if count > 1:
                    self.log_test(f"Role Distribution - {role}", False, 
                                 f"❌ MÚLTIPLOS USUÁRIOS COM FUNÇÃO '{role}': {count}")
                else:
                    self.log_test(f"Role Distribution - {role}", True, 
                                 f"✅ Função '{role}': {count} usuário (correto)")
            
            # Check for expected accounts
            expected_accounts = [
                {"email": "socio.operador@agitocoin.com", "name": "Carlos Silva Operador", "role": "socio_operador"},
                {"email": "mini.agencia@agitocoin.com", "name": "Maria Santos Agência", "role": "mini_agencia"},
                {"email": "consultor@agitocoin.com", "name": "João Costa Consultor", "role": "consultor"}
            ]
            
            print(f"\n🔍 VERIFICAÇÃO DAS CONTAS ESPERADAS:")
            for expected in expected_accounts:
                found_users = [u for u in hierarchical_users if isinstance(u, dict) and u.get('email') == expected['email']]
                
                if len(found_users) == 0:
                    self.log_test(f"Expected Account - {expected['email']}", False, 
                                 f"❌ CONTA AUSENTE: {expected['email']} - {expected['name']}")
                elif len(found_users) == 1:
                    user = found_users[0]
                    self.log_test(f"Expected Account - {expected['email']}", True, 
                                 f"✅ CONTA ENCONTRADA: {user.get('full_name', 'N/A')} - {user.get('hierarchical_role', 'N/A')}")
                else:
                    self.log_test(f"Expected Account - {expected['email']}", False, 
                                 f"❌ DUPLICAÇÃO CRÍTICA: {expected['email']} encontrado {len(found_users)} vezes")
                    for i, user in enumerate(found_users):
                        print(f"      Registro {i+1}: ID={user.get('id', 'N/A')}, Nome={user.get('full_name', 'N/A')}")
            
        else:
            self.log_test("Hierarchical Users API", False, 
                         f"❌ API inacessível - Status: {response.status_code}")
            print("❌ ERRO CRÍTICO: Não é possível acessar API hierárquica")
            return False
        
        # Test 3: Test Master Dashboard access
        print("\n--- TESTE 3: Dashboard Master - Aba Hierarquia ---")
        
        dashboard_response = self.make_request("GET", "/master/dashboard", token=master_token)
        
        if dashboard_response.status_code == 200:
            dashboard_data = dashboard_response.json()
            
            self.log_test("Master Dashboard Access", True, 
                         "✅ Dashboard master acessível")
            
            # Check if dashboard has hierarchical data
            if 'hierarchical_stats' in dashboard_data:
                hierarchical_stats = dashboard_data['hierarchical_stats']
                self.log_test("Dashboard Hierarchical Stats", True, 
                             f"✅ Estatísticas hierárquicas presentes: {hierarchical_stats}")
            else:
                self.log_test("Dashboard Hierarchical Stats", False, 
                             "❌ Estatísticas hierárquicas ausentes no dashboard")
                
        else:
            self.log_test("Master Dashboard Access", False, 
                         f"❌ Dashboard inacessível - Status: {dashboard_response.status_code}")
        
        # Test 4: Direct MongoDB investigation (simulated through API calls)
        print("\n--- TESTE 4: Investigação Detalhada dos Dados ---")
        
        # Count total hierarchical users by different criteria
        total_hierarchical = len(hierarchical_users)
        unique_emails = len(set(user.get('email', '') if isinstance(user, dict) else '' for user in hierarchical_users))
        unique_ids = len(set(user.get('id', '') if isinstance(user, dict) else '' for user in hierarchical_users))
        
        self.log_test("Data Consistency Check", 
                     total_hierarchical == unique_emails == unique_ids,
                     f"Total: {total_hierarchical}, Emails únicos: {unique_emails}, IDs únicos: {unique_ids}")
        
        if total_hierarchical != unique_emails:
            self.log_test("Email Duplication Analysis", False, 
                         f"❌ DUPLICAÇÃO POR EMAIL: {total_hierarchical - unique_emails} duplicatas")
        
        if total_hierarchical != unique_ids:
            self.log_test("ID Duplication Analysis", False, 
                         f"❌ DUPLICAÇÃO POR ID: {total_hierarchical - unique_ids} duplicatas")
        
        # Test 5: Detailed user analysis
        print("\n--- TESTE 5: Análise Detalhada dos Usuários ---")
        
        for i, user in enumerate(hierarchical_users):
            user_email = user.get('email', 'N/A')
            user_name = user.get('full_name', 'N/A')
            user_role = user.get('hierarchical_role', 'N/A')
            user_id = user.get('id', 'N/A')
            is_active = user.get('is_active', False)
            
            print(f"   👤 Usuário {i+1}:")
            print(f"      📧 Email: {user_email}")
            print(f"      👤 Nome: {user_name}")
            print(f"      🏢 Função: {user_role}")
            print(f"      🆔 ID: {user_id}")
            print(f"      ✅ Ativo: {is_active}")
            print(f"      📅 Criado: {user.get('created_at', 'N/A')}")
            print("")
        
        # Final Summary
        print(f"\n🎯 RESUMO FINAL DA INVESTIGAÇÃO DE DUPLICAÇÃO HIERÁRQUICA:")
        print(f"   • Total de usuários hierárquicos encontrados: {total_hierarchical}")
        print(f"   • Emails únicos: {unique_emails}")
        print(f"   • IDs únicos: {unique_ids}")
        print(f"   • Duplicação detectada na API: {'SIM' if api_duplicates_found else 'NÃO'}")
        
        if api_duplicates_found or total_hierarchical != unique_emails or total_hierarchical != unique_ids:
            print("   ❌ RESULTADO: DUPLICAÇÃO CONFIRMADA - Dados hierárquicos têm registros duplicados")
            print("   🚨 AÇÃO NECESSÁRIA: Limpeza segura dos dados duplicados")
            print("   📋 RECOMENDAÇÃO: Identificar registros duplicados e manter apenas os mais recentes/corretos")
            
            # Detailed duplication report
            if duplicate_emails:
                print(f"\n📧 EMAILS DUPLICADOS ENCONTRADOS:")
                for email, count in duplicate_emails.items():
                    print(f"   • {email}: {count} registros")
                    
            if duplicate_ids:
                print(f"\n🆔 IDs DUPLICADOS ENCONTRADOS:")
                for user_id, count in duplicate_ids.items():
                    print(f"   • {user_id}: {count} registros")
                    
        else:
            print("   ✅ RESULTADO: NENHUMA DUPLICAÇÃO ENCONTRADA - Dados hierárquicos estão consistentes")
            print("   ✅ PROBLEMA REPORTADO: NÃO CONFIRMADO - Sistema operacional")
        
        return not api_duplicates_found and total_hierarchical == unique_emails == unique_ids

if __name__ == "__main__":
    investigator = HierarchicalInvestigator()
    investigator.investigate_hierarchical_duplication()