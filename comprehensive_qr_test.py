#!/usr/bin/env python3
"""
Comprehensive QR Code Flow Test - Specific Requirements Validation
Testing all the specific requirements from the review request
"""

import requests
import json
import base64
from datetime import datetime, timezone

class ComprehensiveQRTest:
    def __init__(self):
        self.base_url = "https://api-decompose-1.preview.emergentagent.com/api"
        self.session = requests.Session()
        self.results = []
        
    def log_result(self, test: str, success: bool, details: str):
        self.results.append({"test": test, "success": success, "details": details})
        status = "✅" if success else "❌"
        print(f"{status} {test}: {details}")
    
    def make_request(self, method: str, endpoint: str, data=None, token=None):
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        if method == "GET":
            return self.session.get(url, headers=headers)
        elif method == "POST":
            return self.session.post(url, json=data, headers=headers)
    
    def test_specific_requirements(self):
        print("🎯 TESTE ESPECÍFICO DOS REQUISITOS")
        print("=" * 50)
        
        # 1. Login como lojista@demo.com / demo123
        print("\n1. GERAR QR CODE DO LOJISTA")
        login_data = {"email": "lojista@demo.com", "password": "demo123"}
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code != 200:
            self.log_result("Login Lojista", False, f"Falha no login: {response.status_code}")
            return
        
        lojista_data = response.json()
        lojista_token = lojista_data["access_token"]
        lojista_user = lojista_data["user"]
        
        self.log_result("Login Lojista", True, f"Login realizado: {lojista_user['full_name']}")
        
        # GET /api/merchant/qr-code
        response = self.make_request("GET", "/merchant/qr-code", token=lojista_token)
        
        if response.status_code != 200:
            self.log_result("Gerar QR Code", False, f"Falha ao gerar QR: {response.status_code}")
            return
        
        qr_data = response.json()
        qr_code = qr_data["qr_code"]
        
        # Verificar se QR retornado tem formato AGITOCASH_[base64]
        if qr_code.startswith("AGITOCASH_"):
            self.log_result("Formato QR Code", True, f"QR Code tem formato correto: AGITOCASH_[base64]")
            
            # Decodificar base64 para confirmar dados do lojista
            try:
                encoded_data = qr_code.replace("AGITOCASH_", "")
                decoded_json = base64.b64decode(encoded_data.encode()).decode()
                decoded_data = json.loads(decoded_json)
                
                # Verificar dados do lojista
                required_fields = ["merchant_id", "merchant_name", "cashback_rate", "timestamp"]
                if all(field in decoded_data for field in required_fields):
                    self.log_result("Dados QR Code", True, 
                                   f"Dados completos: ID={decoded_data['merchant_id'][:8]}..., "
                                   f"Nome={decoded_data['merchant_name']}, "
                                   f"Cashback={decoded_data['cashback_rate']}%")
                    
                    # Verificar se merchant_id corresponde ao lojista logado
                    if decoded_data["merchant_id"] == lojista_user["id"]:
                        self.log_result("ID Lojista Correto", True, "merchant_id corresponde ao lojista logado")
                    else:
                        self.log_result("ID Lojista Correto", False, "merchant_id não corresponde ao lojista logado")
                else:
                    self.log_result("Dados QR Code", False, f"Campos obrigatórios ausentes: {required_fields}")
                    
            except Exception as e:
                self.log_result("Decodificar QR Code", False, f"Erro ao decodificar: {str(e)}")
                return
        else:
            self.log_result("Formato QR Code", False, "QR Code não tem formato AGITOCASH_")
            return
        
        # 2. Login como cliente@demo.com / demo123
        print("\n2. PROCESSAR PAGAMENTO COM QR REAL")
        login_data = {"email": "cliente@demo.com", "password": "demo123"}
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code != 200:
            self.log_result("Login Cliente", False, f"Falha no login: {response.status_code}")
            return
        
        cliente_data = response.json()
        cliente_token = cliente_data["access_token"]
        cliente_user = cliente_data["user"]
        
        self.log_result("Login Cliente", True, f"Login realizado: {cliente_user['full_name']}")
        
        # Garantir saldo suficiente
        deposit_data = {"amount": 100.00, "method": "pix"}
        response = self.make_request("POST", "/transactions/deposit", deposit_data, token=cliente_token)
        
        if response.status_code == 200:
            self.log_result("Depósito Cliente", True, "Saldo adicionado para teste")
        
        # POST /api/transactions/payment com amount + qr_code (SEM merchant_id manual)
        payment_data = {
            "amount": 25.00,
            "qr_code": qr_code  # Usando QR Code gerado no teste 1
        }
        
        response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
        
        if response.status_code == 200:
            payment_result = response.json()
            
            # Verificar se identifica lojista automaticamente
            merchant_info = payment_result.get("merchant_info", {})
            if merchant_info:
                self.log_result("Identificação Automática", True, 
                               f"Lojista identificado automaticamente: {merchant_info['name']}")
                
                # Verificar se cashback foi aplicado corretamente
                cashback_earned = payment_result.get("cashback_earned", 0)
                expected_cashback = payment_data["amount"] * (merchant_info["cashback_rate"] / 100) * 0.5
                
                if abs(cashback_earned - expected_cashback) < 0.01:
                    self.log_result("Cashback Aplicado", True, 
                                   f"Cashback correto: R$ {cashback_earned:.2f}")
                else:
                    self.log_result("Cashback Aplicado", False, 
                                   f"Cashback incorreto: R$ {cashback_earned:.2f} (esperado: R$ {expected_cashback:.2f})")
                
                # Verificar informações do QR no response
                qr_info = payment_result.get("qr_info", {})
                if qr_info and "merchant_name" in qr_info:
                    self.log_result("Info QR Response", True, 
                                   f"Informações QR presentes: {qr_info['merchant_name']}")
                else:
                    self.log_result("Info QR Response", False, "Informações QR ausentes no response")
                    
            else:
                self.log_result("Identificação Automática", False, "Lojista não foi identificado automaticamente")
        else:
            self.log_result("Pagamento QR Real", False, f"Falha no pagamento: {response.status_code} - {response.text}")
        
        # 3. Validações de QR Code
        print("\n3. VALIDAÇÕES DE QR CODE")
        
        # QR Code inválido (não AGITOCASH)
        invalid_payment = {"amount": 10.00, "qr_code": "INVALID_QR_123"}
        response = self.make_request("POST", "/transactions/payment", invalid_payment, token=cliente_token)
        
        if response.status_code == 400:
            self.log_result("QR Inválido Rejeitado", True, "QR Code não-AGITOCASH rejeitado corretamente")
        else:
            self.log_result("QR Inválido Rejeitado", False, f"QR inválido deveria ser rejeitado: {response.status_code}")
        
        # QR Code com lojista inexistente
        fake_qr_data = {
            "merchant_id": "fake_merchant_id_12345",
            "merchant_name": "Loja Inexistente",
            "cashback_rate": 5.0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "code": "FAKE123"
        }
        fake_qr_json = json.dumps(fake_qr_data)
        fake_qr_encoded = base64.b64encode(fake_qr_json.encode()).decode()
        fake_qr = f"AGITOCASH_{fake_qr_encoded}"
        
        fake_payment = {"amount": 10.00, "qr_code": fake_qr}
        response = self.make_request("POST", "/transactions/payment", fake_payment, token=cliente_token)
        
        if response.status_code == 404:
            self.log_result("Lojista Inexistente", True, "QR com lojista inexistente rejeitado corretamente")
        else:
            self.log_result("Lojista Inexistente", False, f"QR com lojista inexistente deveria ser rejeitado: {response.status_code}")
        
        # 4. Backward Compatibility
        print("\n4. BACKWARD COMPATIBILITY")
        
        # Testar QR codes antigos/simulados
        old_qr_codes = ["TEST_QR_DEMO", "AGITOCASH_OLD_FORMAT"]
        
        for old_qr in old_qr_codes:
            old_payment = {"amount": 5.00, "qr_code": old_qr}
            response = self.make_request("POST", "/transactions/payment", old_payment, token=cliente_token)
            
            # Backward compatibility: deve rejeitar graciosamente ou processar se suportado
            if response.status_code in [200, 400, 404]:
                self.log_result(f"Backward Compatibility - {old_qr}", True, 
                               f"QR antigo tratado adequadamente: {response.status_code}")
            else:
                self.log_result(f"Backward Compatibility - {old_qr}", False, 
                               f"QR antigo causou erro inesperado: {response.status_code}")
        
        # 5. Verificação Final: Cliente não precisa selecionar lojista
        print("\n5. VERIFICAÇÃO FINAL")
        
        # Confirmar que PaymentRequest só precisa de amount + qr_code
        minimal_payment = {
            "amount": 15.00,
            "qr_code": qr_code
        }
        
        response = self.make_request("POST", "/transactions/payment", minimal_payment, token=cliente_token)
        
        if response.status_code == 200:
            self.log_result("Pagamento Simplificado", True, 
                           "Pagamento funciona apenas com amount + qr_code (sem merchant_id manual)")
        else:
            self.log_result("Pagamento Simplificado", False, 
                           f"Pagamento simplificado falhou: {response.status_code}")
        
        # Resumo final
        self.print_summary()
    
    def print_summary(self):
        print("\n" + "=" * 50)
        print("📊 RESUMO FINAL DOS TESTES ESPECÍFICOS")
        print("=" * 50)
        
        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)
        
        print(f"✅ PASSOU: {passed}/{total}")
        print(f"❌ FALHOU: {total - passed}/{total}")
        print(f"📈 TAXA DE SUCESSO: {(passed/total*100):.1f}%")
        
        failed_tests = [r for r in self.results if not r["success"]]
        if failed_tests:
            print("\n🔍 TESTES QUE FALHARAM:")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        print("\n🎯 CONCLUSÃO:")
        if passed == total:
            print("✅ TODOS OS REQUISITOS ESPECÍFICOS FORAM ATENDIDOS!")
            print("✅ Novo fluxo QR Code funcionando perfeitamente")
            print("✅ Cliente não precisa mais selecionar lojista manualmente")
            print("✅ QR Code contém todos os dados do lojista")
            print("✅ Backend decodifica QR Code automaticamente")
        else:
            print(f"⚠️  {total - passed} REQUISITOS PRECISAM DE ATENÇÃO")
        
        print("=" * 50)

if __name__ == "__main__":
    tester = ComprehensiveQRTest()
    tester.test_specific_requirements()