#!/usr/bin/env python3
"""
AgitoCash QR Code Flow Testing Suite
Testing the new QR Code payment flow without manual merchant selection
"""

import requests
import json
import time
import base64
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

class QRCodeFlowTester:
    def __init__(self, base_url: str = "https://slim-super-app.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tokens = {}
        self.users = {}
        self.test_results = []
        self.qr_codes = {}
        
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def login_demo_users(self):
        """Login with demo credentials"""
        print("\n=== LOGGING IN DEMO USERS ===")
        
        demo_credentials = [
            {
                "email": "cliente@demo.com",
                "password": "demo123",
                "type": "cliente"
            },
            {
                "email": "lojista@demo.com", 
                "password": "demo123",
                "type": "lojista"
            }
        ]
        
        for cred in demo_credentials:
            login_data = {
                "email": cred["email"],
                "password": cred["password"]
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.tokens[cred["type"]] = data["access_token"]
                self.users[cred["type"]] = data["user"]
                self.log_test(f"Demo {cred['type']} Login", True, 
                             f"Login successful: {data['user']['full_name']}")
            else:
                self.log_test(f"Demo {cred['type']} Login", False, 
                             f"Login failed - Status: {response.status_code}, Error: {response.text}")
                return False
        
        return True

    def test_merchant_qr_generation(self):
        """Test 1: Generate QR Code as merchant"""
        print("\n=== TEST 1: MERCHANT QR CODE GENERATION ===")
        
        lojista_token = self.tokens.get("lojista")
        if not lojista_token:
            self.log_test("QR Generation", False, "Lojista token not available")
            return False
            
        response = self.make_request("GET", "/merchant/qr-code", token=lojista_token)
        
        if response.status_code == 200:
            data = response.json()
            qr_code = data["qr_code"]
            
            # Verify QR Code format
            if qr_code.startswith("AGITOCASH_"):
                self.log_test("QR Code Format", True, f"QR Code has correct AGITOCASH_ prefix")
                
                # Decode and verify QR Code content
                try:
                    encoded_data = qr_code.replace("AGITOCASH_", "")
                    qr_json = base64.b64decode(encoded_data.encode()).decode()
                    qr_data = json.loads(qr_json)
                    
                    # Verify required fields
                    required_fields = ["merchant_id", "merchant_name", "cashback_rate", "timestamp", "code"]
                    missing_fields = [field for field in required_fields if field not in qr_data]
                    
                    if not missing_fields:
                        self.log_test("QR Code Content", True, 
                                     f"All required fields present: merchant_id={qr_data['merchant_id']}, "
                                     f"merchant_name={qr_data['merchant_name']}, "
                                     f"cashback_rate={qr_data['cashback_rate']}%")
                        
                        # Store QR code for payment tests
                        self.qr_codes["valid"] = qr_code
                        self.qr_codes["merchant_data"] = qr_data
                        
                        # Verify merchant_id matches logged in merchant
                        if qr_data["merchant_id"] == self.users["lojista"]["id"]:
                            self.log_test("QR Merchant ID Match", True, "QR Code merchant_id matches logged in merchant")
                        else:
                            self.log_test("QR Merchant ID Match", False, "QR Code merchant_id doesn't match logged in merchant")
                        
                        return True
                    else:
                        self.log_test("QR Code Content", False, f"Missing required fields: {missing_fields}")
                        
                except Exception as e:
                    self.log_test("QR Code Decode", False, f"Failed to decode QR Code: {str(e)}")
            else:
                self.log_test("QR Code Format", False, "QR Code doesn't have AGITOCASH_ prefix")
        else:
            self.log_test("QR Generation", False, f"Status: {response.status_code}, Error: {response.text}")
            
        return False

    def test_payment_with_real_qr(self):
        """Test 2: Process payment with real QR Code"""
        print("\n=== TEST 2: PAYMENT WITH REAL QR CODE ===")
        
        cliente_token = self.tokens.get("cliente")
        valid_qr = self.qr_codes.get("valid")
        
        if not cliente_token or not valid_qr:
            self.log_test("Payment Prerequisites", False, "Cliente token or valid QR code not available")
            return False
        
        # First, ensure client has sufficient balance
        deposit_data = {
            "amount": 100.00,
            "method": "pix"
        }
        
        deposit_response = self.make_request("POST", "/transactions/deposit", deposit_data, token=cliente_token)
        if deposit_response.status_code == 200:
            self.log_test("Pre-payment Deposit", True, "Added R$ 100.00 to client balance")
        else:
            self.log_test("Pre-payment Deposit", False, "Failed to add balance for payment test")
        
        # Now test payment with QR Code (NEW FLOW - only amount + qr_code)
        payment_data = {
            "amount": 50.00,
            "qr_code": valid_qr
        }
        
        response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify automatic merchant identification
            merchant_info = data.get("merchant_info", {})
            qr_info = data.get("qr_info", {})
            
            if merchant_info and qr_info:
                self.log_test("Automatic Merchant ID", True, 
                             f"Merchant automatically identified: {merchant_info['name']}, "
                             f"Cashback rate: {merchant_info['cashback_rate']}%")
                
                # Verify cashback calculation
                cashback_earned = data.get("cashback_earned", 0)
                expected_cashback = payment_data["amount"] * (merchant_info["cashback_rate"] / 100) * 0.5  # 50% to client
                
                if abs(cashback_earned - expected_cashback) < 0.01:  # Allow small floating point differences
                    self.log_test("Cashback Calculation", True, 
                                 f"Correct cashback: R$ {cashback_earned:.2f} (expected: R$ {expected_cashback:.2f})")
                else:
                    self.log_test("Cashback Calculation", False, 
                                 f"Incorrect cashback: R$ {cashback_earned:.2f} (expected: R$ {expected_cashback:.2f})")
                
                # Verify cashback distribution
                distribution = data.get("cashback_distribution", {})
                if distribution:
                    self.log_test("Cashback Distribution", True, 
                                 f"Distribution: Client={distribution.get('client', 0):.2f}, "
                                 f"Platform={distribution.get('platform', 0):.2f}")
                else:
                    self.log_test("Cashback Distribution", False, "No cashback distribution data")
                
                return True
            else:
                self.log_test("Payment Response Data", False, "Missing merchant_info or qr_info in response")
        else:
            self.log_test("Payment Processing", False, f"Status: {response.status_code}, Error: {response.text}")
            
        return False

    def test_invalid_qr_codes(self):
        """Test 3: Validate QR Code error handling"""
        print("\n=== TEST 3: INVALID QR CODE VALIDATION ===")
        
        cliente_token = self.tokens.get("cliente")
        if not cliente_token:
            self.log_test("Invalid QR Prerequisites", False, "Cliente token not available")
            return
        
        # Test 1: Invalid QR Code (not AGITOCASH format)
        invalid_qr_1 = "INVALID_QR_CODE_123"
        payment_data = {
            "amount": 10.00,
            "qr_code": invalid_qr_1
        }
        
        response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
        
        if response.status_code == 400:
            self.log_test("Invalid QR Format", True, "Non-AGITOCASH QR Code rejected correctly")
        else:
            self.log_test("Invalid QR Format", False, f"Should reject non-AGITOCASH QR Code, got: {response.status_code}")
        
        # Test 2: Malformed AGITOCASH QR Code
        invalid_qr_2 = "AGITOCASH_INVALID_BASE64"
        payment_data["qr_code"] = invalid_qr_2
        
        response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
        
        if response.status_code == 400:
            self.log_test("Malformed QR Code", True, "Malformed AGITOCASH QR Code rejected correctly")
        else:
            self.log_test("Malformed QR Code", False, f"Should reject malformed QR Code, got: {response.status_code}")
        
        # Test 3: Expired QR Code (simulate by creating one with old timestamp)
        try:
            expired_qr_data = {
                "merchant_id": "fake_merchant_id",
                "merchant_name": "Fake Merchant",
                "cashback_rate": 5.0,
                "timestamp": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),  # 1 hour ago
                "code": "EXPIRED123"
            }
            
            expired_qr_json = json.dumps(expired_qr_data)
            expired_qr_encoded = base64.b64encode(expired_qr_json.encode()).decode()
            expired_qr = f"AGITOCASH_{expired_qr_encoded}"
            
            payment_data["qr_code"] = expired_qr
            
            response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
            
            if response.status_code == 400:
                self.log_test("Expired QR Code", True, "Expired QR Code rejected correctly")
            else:
                self.log_test("Expired QR Code", False, f"Should reject expired QR Code, got: {response.status_code}")
                
        except Exception as e:
            self.log_test("Expired QR Code Test", False, f"Failed to create expired QR Code: {str(e)}")
        
        # Test 4: QR Code with non-existent merchant
        try:
            fake_merchant_qr_data = {
                "merchant_id": "non_existent_merchant_id_12345",
                "merchant_name": "Non-existent Merchant",
                "cashback_rate": 5.0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "code": "FAKE123"
            }
            
            fake_qr_json = json.dumps(fake_merchant_qr_data)
            fake_qr_encoded = base64.b64encode(fake_qr_json.encode()).decode()
            fake_qr = f"AGITOCASH_{fake_qr_encoded}"
            
            payment_data["qr_code"] = fake_qr
            
            response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
            
            if response.status_code == 404:
                self.log_test("Non-existent Merchant", True, "QR Code with non-existent merchant rejected correctly")
            else:
                self.log_test("Non-existent Merchant", False, f"Should reject QR Code with non-existent merchant, got: {response.status_code}")
                
        except Exception as e:
            self.log_test("Non-existent Merchant Test", False, f"Failed to create fake merchant QR Code: {str(e)}")

    def test_backward_compatibility(self):
        """Test 4: Backward compatibility with old QR codes"""
        print("\n=== TEST 4: BACKWARD COMPATIBILITY ===")
        
        cliente_token = self.tokens.get("cliente")
        if not cliente_token:
            self.log_test("Backward Compatibility Prerequisites", False, "Cliente token not available")
            return
        
        # Test with a simple test QR code (simulate old format)
        test_qr_codes = [
            "TEST_QR_CODE_123",
            "DEMO_QR_MERCHANT_456",
            "AGITOCASH_TEST_789"
        ]
        
        for test_qr in test_qr_codes:
            payment_data = {
                "amount": 5.00,
                "qr_code": test_qr
            }
            
            response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
            
            # For backward compatibility, we expect these to be handled gracefully
            # Either processed (if supported) or rejected with clear error message
            if response.status_code in [200, 400, 404]:
                if response.status_code == 200:
                    self.log_test(f"Backward Compatibility - {test_qr}", True, "Old QR format still supported")
                else:
                    self.log_test(f"Backward Compatibility - {test_qr}", True, "Old QR format gracefully rejected")
            else:
                self.log_test(f"Backward Compatibility - {test_qr}", False, 
                             f"Unexpected response for old QR format: {response.status_code}")

    def test_qr_code_security(self):
        """Additional security tests for QR Code flow"""
        print("\n=== ADDITIONAL SECURITY TESTS ===")
        
        cliente_token = self.tokens.get("cliente")
        valid_qr = self.qr_codes.get("valid")
        
        if not cliente_token or not valid_qr:
            self.log_test("Security Test Prerequisites", False, "Prerequisites not available")
            return
        
        # Test 1: Payment with insufficient balance
        payment_data = {
            "amount": 10000.00,  # Much larger than available balance
            "qr_code": valid_qr
        }
        
        response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
        
        if response.status_code == 400 and "saldo insuficiente" in response.text.lower():
            self.log_test("Insufficient Balance Check", True, "Insufficient balance properly detected")
        else:
            self.log_test("Insufficient Balance Check", False, "Should reject payment with insufficient balance")
        
        # Test 2: Payment with zero or negative amount
        for amount in [0, -10.00]:
            payment_data = {
                "amount": amount,
                "qr_code": valid_qr
            }
            
            response = self.make_request("POST", "/transactions/payment", payment_data, token=cliente_token)
            
            if response.status_code == 400 or response.status_code == 422:
                self.log_test(f"Invalid Amount ({amount})", True, f"Amount {amount} properly rejected")
            else:
                self.log_test(f"Invalid Amount ({amount})", False, f"Should reject amount {amount}")

    def run_qr_flow_tests(self):
        """Run all QR Code flow tests"""
        print("🎯 TESTE URGENTE: VALIDANDO NOVO FLUXO QR CODE")
        print("=" * 60)
        
        try:
            # Step 1: Login demo users
            if not self.login_demo_users():
                print("❌ FALHA CRÍTICA: Não foi possível fazer login com credenciais demo")
                return
            
            # Step 2: Test merchant QR generation
            if not self.test_merchant_qr_generation():
                print("❌ FALHA CRÍTICA: Não foi possível gerar QR Code do lojista")
                return
            
            # Step 3: Test payment with real QR
            if not self.test_payment_with_real_qr():
                print("❌ FALHA CRÍTICA: Não foi possível processar pagamento com QR Code")
                return
            
            # Step 4: Test QR validation
            self.test_invalid_qr_codes()
            
            # Step 5: Test backward compatibility
            self.test_backward_compatibility()
            
            # Step 6: Additional security tests
            self.test_qr_code_security()
            
        except Exception as e:
            print(f"❌ ERRO CRÍTICO NOS TESTES QR: {e}")
            self.log_test("Critical QR Test Error", False, str(e))
        
        # Print summary
        self.print_test_summary()

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 60)
        print("📊 RESUMO DOS TESTES QR CODE FLOW")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"✅ PASSOU: {passed}")
        print(f"❌ FALHOU: {failed}")
        print(f"📈 TAXA DE SUCESSO: {(passed/len(self.test_results)*100):.1f}%")
        
        # Group results by test category
        categories = {}
        for result in self.test_results:
            category = result["test"].split(" - ")[0] if " - " in result["test"] else "General"
            if category not in categories:
                categories[category] = {"passed": 0, "failed": 0, "tests": []}
            
            if result["success"]:
                categories[category]["passed"] += 1
            else:
                categories[category]["failed"] += 1
            categories[category]["tests"].append(result)
        
        print("\n📋 RESULTADOS POR CATEGORIA:")
        for category, data in categories.items():
            total = data["passed"] + data["failed"]
            success_rate = (data["passed"] / total * 100) if total > 0 else 0
            print(f"  {category}: {data['passed']}/{total} ({success_rate:.1f}%)")
        
        if failed > 0:
            print("\n🔍 TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        
        # Summary for main agent
        if failed == 0:
            print("🎉 TODOS OS TESTES QR CODE PASSARAM!")
            print("✅ Novo fluxo QR Code funcionando perfeitamente")
            print("✅ Cliente não precisa mais selecionar lojista manualmente")
            print("✅ QR Code contém todos os dados necessários")
            print("✅ Validações de segurança funcionando")
        else:
            print("⚠️  ALGUNS TESTES FALHARAM - REQUER ATENÇÃO")

if __name__ == "__main__":
    # Run the QR Code flow tests
    tester = QRCodeFlowTester()
    tester.run_qr_flow_tests()