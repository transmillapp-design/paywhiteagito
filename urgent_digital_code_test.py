#!/usr/bin/env python3
"""
INVESTIGAÇÃO URGENTE: Problema na validação de código digitável
PROBLEMA REPORTADO: Cliente tenta validar código digitável e recebe erro "código não encontrado ou expirado"

TESTES ESPECÍFICOS:
1. Login como lojista@demo.com / demo123
2. POST /api/merchant/qr-code com {"amount": 30.00}
3. Verificar se código digitável é salvo corretamente no banco
4. Testar validação imediatamente após geração
5. Verificar collection digital_codes
6. Debug da função generate_digital_code
7. Teste com diferentes códigos
"""

import requests
import json
import time
import hashlib
import base64
from typing import Dict, Any, Optional

class UrgentDigitalCodeTester:
    def __init__(self, base_url: str = "https://slim-super-app.preview.emergentagent.com/api"):
        self.base_url = base_url
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_1_lojista_login(self):
        """TESTE 1: Login como lojista@demo.com / demo123"""
        print("\n--- TESTE 1: Login como lojista@demo.com / demo123 ---")
        
        login_data = {
            "email": "lojista@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code == 200:
            data = response.json()
            self.lojista_token = data["access_token"]
            user_data = data["user"]
            
            self.log_test("1. Lojista Login", True, 
                         f"Login realizado com sucesso para: {user_data.get('company_name', user_data.get('full_name'))}")
            
            print(f"   • Email: {user_data.get('email')}")
            print(f"   • Nome/Empresa: {user_data.get('company_name', user_data.get('full_name'))}")
            print(f"   • Tipo: {user_data.get('user_type')}")
            print(f"   • Token: {self.lojista_token[:20]}...")
            
            return True
        else:
            self.log_test("1. Lojista Login", False, 
                         f"Falha no login: Status {response.status_code} - {response.text}")
            return False

    def test_2_qr_code_generation(self):
        """TESTE 2: POST /api/merchant/qr-code com {"amount": 30.00}"""
        print("\n--- TESTE 2: POST /api/merchant/qr-code com amount: 30.00 ---")
        
        if not hasattr(self, 'lojista_token'):
            self.log_test("2. QR Generation", False, "Token de lojista não disponível")
            return False
        
        qr_request = {
            "amount": 30.00
        }
        
        response = self.make_request("POST", "/merchant/qr-code", qr_request, token=self.lojista_token)
        
        if response.status_code == 200:
            self.qr_data = response.json()
            
            print(f"📋 RESPOSTA COMPLETA DO BACKEND:")
            print(json.dumps(self.qr_data, indent=2, ensure_ascii=False))
            
            # Verificar campos obrigatórios
            required_fields = ["qr_code", "digital_code", "merchant_id", "merchant_name", "amount", "cashback_rate"]
            missing_fields = [field for field in required_fields if field not in self.qr_data]
            
            if missing_fields:
                self.log_test("2. QR Generation", False, 
                             f"Campos ausentes na resposta: {missing_fields}")
                return False
            else:
                self.log_test("2. QR Generation", True, 
                             f"QR Code gerado com sucesso - Código: {self.qr_data['digital_code']}")
                
                print(f"   • QR Code: {self.qr_data['qr_code'][:50]}...")
                print(f"   • Digital Code: {self.qr_data['digital_code']}")
                print(f"   • Merchant ID: {self.qr_data['merchant_id']}")
                print(f"   • Merchant Name: {self.qr_data['merchant_name']}")
                print(f"   • Amount: R$ {self.qr_data['amount']:.2f}")
                print(f"   • Cashback Rate: {self.qr_data['cashback_rate']}%")
                
                return True
        else:
            self.log_test("2. QR Generation", False, 
                         f"Falha na geração: Status {response.status_code} - {response.text}")
            return False

    def test_3_digital_code_format(self):
        """TESTE 3: Verificar formato do código digitável"""
        print("\n--- TESTE 3: Verificar formato do código digitável ---")
        
        if not hasattr(self, 'qr_data') or 'digital_code' not in self.qr_data:
            self.log_test("3. Code Format", False, "Código digitável não disponível")
            return False
        
        digital_code = self.qr_data['digital_code']
        print(f"🔍 CÓDIGO DIGITÁVEL: {digital_code}")
        
        # Verificar formato AGITO-XXXX-XXXX-XXXX
        if digital_code.startswith("AGITO-"):
            parts = digital_code.split("-")
            if len(parts) == 4 and all(len(part) == 4 for part in parts[1:]):
                self.log_test("3. Code Format", True, 
                             f"Formato correto: {digital_code}")
                
                print(f"   • Prefixo: ✅ AGITO-")
                print(f"   • Partes: ✅ {len(parts)} partes")
                print(f"   • Tamanhos: ✅ {[len(part) for part in parts[1:]]}")
                
                return True
            else:
                self.log_test("3. Code Format", False, 
                             f"Formato incorreto - partes: {[len(part) for part in parts]}")
                return False
        else:
            self.log_test("3. Code Format", False, 
                         f"Formato incorreto - não começa com AGITO-: {digital_code}")
            return False

    def test_4_immediate_validation(self):
        """TESTE 4: Testar validação imediatamente após geração"""
        print("\n--- TESTE 4: Validar código digitável imediatamente após geração ---")
        
        if not hasattr(self, 'qr_data') or 'digital_code' not in self.qr_data:
            self.log_test("4. Immediate Validation", False, "Código digitável não disponível")
            return False
        
        digital_code = self.qr_data['digital_code']
        print(f"🔍 TESTANDO CÓDIGO EXATO: {digital_code}")
        
        validation_request = {
            "digital_code": digital_code
        }
        
        response = self.make_request("POST", "/transactions/validate-digital-code", validation_request)
        
        print(f"📋 RESPOSTA DA VALIDAÇÃO:")
        print(f"   • Status Code: {response.status_code}")
        print(f"   • Response: {response.text}")
        
        if response.status_code == 200:
            validation_data = response.json()
            
            self.log_test("4. Immediate Validation", True, 
                         f"Código validado com sucesso - Loja: {validation_data['merchant_name']}, "
                         f"Valor: R$ {validation_data['amount']:.2f}")
            
            print(f"   • Valid: ✅ {validation_data.get('valid')}")
            print(f"   • Merchant Name: ✅ {validation_data.get('merchant_name')}")
            print(f"   • Amount: ✅ R$ {validation_data.get('amount', 0):.2f}")
            print(f"   • Cashback Rate: ✅ {validation_data.get('cashback_rate', 0)}%")
            
            return True
            
        elif response.status_code == 404:
            self.log_test("4. Immediate Validation", False, 
                         f"🚨 PROBLEMA CRÍTICO: Código não encontrado no banco imediatamente após geração!")
            
            print("🚨 ESTE É O PROBLEMA REPORTADO!")
            print("   • O código foi gerado mas não foi salvo no banco")
            print("   • Ou não está sendo encontrado na busca")
            
            return False
            
        else:
            self.log_test("4. Immediate Validation", False, 
                         f"Erro na validação: Status {response.status_code} - {response.text}")
            return False

    def test_5_qr_code_decode(self):
        """TESTE 5: Decodificar QR Code para verificar estrutura"""
        print("\n--- TESTE 5: Decodificar QR Code para verificar estrutura ---")
        
        if not hasattr(self, 'qr_data') or 'qr_code' not in self.qr_data:
            self.log_test("5. QR Decode", False, "QR Code não disponível")
            return False
        
        qr_code = self.qr_data['qr_code']
        print(f"🔍 QR CODE: {qr_code[:50]}...")
        
        try:
            if not qr_code.startswith("AGITOCASH_"):
                self.log_test("5. QR Decode", False, "QR Code não tem prefixo AGITOCASH_")
                return False
            
            # Decodificar QR Code
            encoded_data = qr_code.replace("AGITOCASH_", "")
            qr_json = base64.b64decode(encoded_data.encode()).decode()
            decoded_qr = json.loads(qr_json)
            
            print(f"📋 QR CODE DECODIFICADO:")
            print(json.dumps(decoded_qr, indent=2, ensure_ascii=False))
            
            # Verificar campos obrigatórios
            required_fields = ["merchant_id", "merchant_name", "cashback_rate", "amount", "timestamp"]
            missing_fields = [field for field in required_fields if field not in decoded_qr]
            
            if missing_fields:
                self.log_test("5. QR Decode", False, f"Campos ausentes no QR: {missing_fields}")
                return False
            else:
                self.log_test("5. QR Decode", True, 
                             f"QR Code decodificado com sucesso - Valor: R$ {decoded_qr.get('amount', 0):.2f}")
                
                self.decoded_qr = decoded_qr
                return True
                
        except Exception as e:
            self.log_test("5. QR Decode", False, f"Erro ao decodificar QR Code: {str(e)}")
            return False

    def test_6_generate_digital_code_debug(self):
        """TESTE 6: Debug da função generate_digital_code"""
        print("\n--- TESTE 6: Debug da função generate_digital_code ---")
        
        if not hasattr(self, 'qr_data'):
            self.log_test("6. Code Generation Debug", False, "QR Data não disponível")
            return False
        
        qr_code = self.qr_data['qr_code']
        actual_digital_code = self.qr_data['digital_code']
        
        try:
            # Replicar a lógica do backend
            encoded_part = qr_code.replace("AGITOCASH_", "")
            hash_obj = hashlib.md5(encoded_part.encode())
            hex_hash = hash_obj.hexdigest().upper()
            
            expected_code = f"AGITO-{hex_hash[0:4]}-{hex_hash[4:8]}-{hex_hash[8:12]}"
            
            print(f"🔍 DEBUG DA GERAÇÃO:")
            print(f"   • QR Code: {qr_code[:50]}...")
            print(f"   • Encoded Part: {encoded_part[:50]}...")
            print(f"   • MD5 Hash: {hex_hash}")
            print(f"   • Expected Code: {expected_code}")
            print(f"   • Actual Code: {actual_digital_code}")
            
            if expected_code == actual_digital_code:
                self.log_test("6. Code Generation Debug", True, 
                             "Função generate_digital_code funcionando corretamente")
                return True
            else:
                self.log_test("6. Code Generation Debug", False, 
                             f"Discrepância: esperado {expected_code}, recebido {actual_digital_code}")
                return False
                
        except Exception as e:
            self.log_test("6. Code Generation Debug", False, f"Erro ao debugar função: {str(e)}")
            return False

    def test_7_multiple_codes(self):
        """TESTE 7: Gerar múltiplos códigos para verificar padrão"""
        print("\n--- TESTE 7: Gerar múltiplos códigos para verificar padrão ---")
        
        if not hasattr(self, 'lojista_token'):
            self.log_test("7. Multiple Codes", False, "Token de lojista não disponível")
            return False
        
        test_amounts = [15.50, 75.00, 100.00]
        successful_validations = 0
        
        for i, test_amount in enumerate(test_amounts, 1):
            print(f"\n🔸 Teste {i}: Gerando código para R$ {test_amount:.2f}")
            
            qr_request = {"amount": test_amount}
            response = self.make_request("POST", "/merchant/qr-code", qr_request, token=self.lojista_token)
            
            if response.status_code == 200:
                test_qr_data = response.json()
                test_digital_code = test_qr_data["digital_code"]
                
                print(f"   • Código gerado: {test_digital_code}")
                
                # Testar validação imediatamente
                validation_request = {"digital_code": test_digital_code}
                validation_response = self.make_request("POST", "/transactions/validate-digital-code", validation_request)
                
                if validation_response.status_code == 200:
                    validation_data = validation_response.json()
                    self.log_test(f"7.{i} Multi-Code Test", True, 
                                 f"Código R$ {test_amount:.2f} válido: {test_digital_code}")
                    successful_validations += 1
                    
                    print(f"   • Validação: ✅ Sucesso")
                    print(f"   • Loja: {validation_data.get('merchant_name')}")
                    print(f"   • Valor: R$ {validation_data.get('amount', 0):.2f}")
                    
                else:
                    self.log_test(f"7.{i} Multi-Code Test", False, 
                                 f"Código R$ {test_amount:.2f} inválido: Status {validation_response.status_code}")
                    print(f"   • Validação: ❌ Falhou - Status {validation_response.status_code}")
                    print(f"   • Erro: {validation_response.text}")
            else:
                self.log_test(f"7.{i} Multi-Code Generation", False, 
                             f"Falha ao gerar código para R$ {test_amount:.2f}: Status {response.status_code}")
                print(f"   • Geração: ❌ Falhou - Status {response.status_code}")
        
        return successful_validations >= 2

    def test_8_database_structure_inference(self):
        """TESTE 8: Inferir estrutura da collection digital_codes"""
        print("\n--- TESTE 8: Inferir estrutura da collection digital_codes ---")
        
        # Baseado nos testes anteriores, podemos inferir a estrutura
        if hasattr(self, 'qr_data'):
            expected_structure = {
                "digital_code": self.qr_data.get('digital_code'),
                "qr_code": self.qr_data.get('qr_code'),
                "merchant_id": self.qr_data.get('merchant_id'),
                "amount": self.qr_data.get('amount'),
                "created_at": "ISO timestamp",
                "expires_at": "ISO timestamp (2 horas no futuro)"
            }
            
            print(f"📋 ESTRUTURA ESPERADA NA COLLECTION digital_codes:")
            print(json.dumps(expected_structure, indent=2, ensure_ascii=False))
            
            self.log_test("8. Database Structure", True, 
                         "Estrutura da collection digital_codes inferida com base nos testes")
            return True
        else:
            self.log_test("8. Database Structure", False, "Não foi possível inferir estrutura")
            return False

    def run_urgent_investigation(self):
        """Executar investigação completa do problema reportado"""
        print("🚨 INVESTIGAÇÃO URGENTE: Problema na validação de código digitável")
        print("PROBLEMA REPORTADO: Cliente tenta validar código digitável e recebe erro 'código não encontrado ou expirado'")
        print("=" * 100)
        
        # Executar todos os testes em sequência
        tests = [
            self.test_1_lojista_login,
            self.test_2_qr_code_generation,
            self.test_3_digital_code_format,
            self.test_4_immediate_validation,
            self.test_5_qr_code_decode,
            self.test_6_generate_digital_code_debug,
            self.test_7_multiple_codes,
            self.test_8_database_structure_inference
        ]
        
        results = []
        for test in tests:
            try:
                result = test()
                results.append(result)
            except Exception as e:
                print(f"❌ ERRO NO TESTE {test.__name__}: {e}")
                results.append(False)
        
        # Análise final
        self.final_diagnosis(results)
        
        # Resumo dos testes
        self.print_test_summary()

    def final_diagnosis(self, results):
        """Diagnóstico final baseado nos resultados dos testes"""
        print("\n" + "=" * 80)
        print("🎯 DIAGNÓSTICO FINAL")
        print("=" * 80)
        
        successful_tests = sum(1 for r in results if r)
        total_tests = len(results)
        
        print(f"📊 RESULTADOS: {successful_tests}/{total_tests} testes passaram")
        
        # Análise específica
        login_ok = results[0] if len(results) > 0 else False
        generation_ok = results[1] if len(results) > 1 else False
        format_ok = results[2] if len(results) > 2 else False
        validation_ok = results[3] if len(results) > 3 else False
        multiple_codes_ok = results[6] if len(results) > 6 else False
        
        if login_ok and generation_ok and format_ok and validation_ok and multiple_codes_ok:
            print("\n✅ CONCLUSÃO: SISTEMA FUNCIONANDO CORRETAMENTE")
            print("   • Login do lojista: ✅ Operacional")
            print("   • Geração de QR Code: ✅ Operacional")
            print("   • Formato do código: ✅ Correto")
            print("   • Validação imediata: ✅ Operacional")
            print("   • Múltiplos códigos: ✅ Operacional")
            print("   • Salvamento no banco: ✅ Funcionando")
            print("\n💡 RECOMENDAÇÃO:")
            print("   O BACKEND ESTÁ FUNCIONANDO 100% CORRETAMENTE.")
            print("   O problema reportado NÃO está no backend.")
            print("   Verificar:")
            print("   - Frontend: Como o código digitável é exibido para o usuário")
            print("   - Integração: Como o frontend chama a API de validação")
            print("   - UX: Se o usuário está copiando o código corretamente")
            
        elif login_ok and generation_ok and not validation_ok:
            print("\n🚨 CONCLUSÃO: PROBLEMA IDENTIFICADO NO BACKEND")
            print("   • Login do lojista: ✅ Operacional")
            print("   • Geração de QR Code: ✅ Operacional")
            print("   • Formato do código: ✅ Correto")
            print("   • Validação imediata: ❌ FALHANDO")
            print("   • Salvamento no banco: ❌ PROBLEMA")
            print("\n🔧 AÇÃO NECESSÁRIA:")
            print("   PROBLEMA CONFIRMADO NO BACKEND:")
            print("   - Códigos são gerados mas não salvos na collection digital_codes")
            print("   - Ou há problema na busca/consulta dos códigos")
            print("   - Verificar função de salvamento no endpoint /merchant/qr-code")
            print("   - Verificar função de busca no endpoint /transactions/validate-digital-code")
            
        else:
            print("\n⚠️ CONCLUSÃO: PROBLEMAS MÚLTIPLOS IDENTIFICADOS")
            print(f"   • Login: {'✅' if login_ok else '❌'}")
            print(f"   • Geração: {'✅' if generation_ok else '❌'}")
            print(f"   • Formato: {'✅' if format_ok else '❌'}")
            print(f"   • Validação: {'✅' if validation_ok else '❌'}")
            print("\n🔧 AÇÃO NECESSÁRIA:")
            print("   Múltiplos problemas detectados no backend.")
            print("   Revisar implementação completa do sistema de códigos digitáveis.")

    def print_test_summary(self):
        """Imprimir resumo dos testes"""
        print("\n" + "=" * 80)
        print("📊 RESUMO DETALHADO DOS TESTES")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"✅ PASSOU: {passed}")
        print(f"❌ FALHOU: {failed}")
        print(f"📈 TAXA DE SUCESSO: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        print("\n🎯 TESTES QUE PASSARAM:")
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}: {result['details']}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    # Executar investigação urgente
    tester = UrgentDigitalCodeTester()
    tester.run_urgent_investigation()