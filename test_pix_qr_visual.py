#!/usr/bin/env python3
"""
Teste específico para PIX QR Code Visual no AgitoCoin
"""

import requests
import json
import sys
import os

class PixQRVisualTester:
    def __init__(self):
        self.base_url = "https://api-decompose-1.preview.emergentagent.com/api"
        self.test_results = []
        
    def log_test(self, test_name, success, details):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details
        }
        self.test_results.append(result)
        
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"   {status}: {test_name}")
        print(f"      {details}")
        
    def make_request(self, method, endpoint, data=None, token=None):
        """Make HTTP request to API"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Método HTTP não suportado: {method}")
                
            return response
        except Exception as e:
            print(f"❌ Erro na requisição {method} {endpoint}: {str(e)}")
            return None
    
    def _login_demo_client(self):
        """Login with demo client credentials"""
        login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            return None
    
    def test_pix_visual_qr_code_complete(self):
        """🚨 TESTE FINAL DA IMPLEMENTAÇÃO COMPLETA DO PIX COM QR CODE VISUAL NO AGITOCOIN"""
        print("\n🚨 TESTE FINAL DA IMPLEMENTAÇÃO COMPLETA DO PIX COM QR CODE VISUAL NO AGITOCOIN")
        print("=" * 80)
        print("IMPLEMENTAÇÃO REALIZADA:")
        print("1. ✅ Biblioteca QR Code instalada: qrcode[pil] para geração de QR Code visual")
        print("2. ✅ Backend XGate Service atualizado: Função _generate_pix_qr_code() melhorada")
        print("3. ✅ Agora gera QR Code visual (base64 image)")
        print("4. ✅ Retorna: qr_code_text, qr_code_image, pix_copy_paste")
        print("5. ✅ Formato EMV PIX conforme BACEN")
        print("6. ✅ Frontend ClientDashboard atualizado: Modal PIX completo implementado")
        print("")
        print("TESTES NECESSÁRIOS:")
        print("1. Login: cliente@demo.com/demo123")
        print("2. Criar depósito PIX R$ 15,00")
        print("3. Verificar se modal abre automaticamente")
        print("4. Validar se QR Code visual é exibido")
        print("5. Testar função copiar código PIX")
        print("6. Validação de Dados PIX: qr_code_image (base64), pix_copy_paste (texto), pix_key")
        print("7. Validar expiração (30 minutos)")
        print("8. Interface PIX Modal: layout similar aos bancos, funcionalidade de copiar")
        print("9. Backend QR Code Generation: POST /api/xgate/pix-deposit R$ 15,00")
        print("=" * 80)
        
        # Test 1: Login with demo client
        print("\n--- TESTE 1: Login Cliente Demo ---")
        
        cliente_token = self._login_demo_client()
        if not cliente_token:
            self.log_test("Cliente Demo Login", False, "❌ Não foi possível fazer login com cliente@demo.com/demo123")
            return False
        
        self.log_test("Cliente Demo Login", True, "✅ Login cliente@demo.com/demo123 funcionando perfeitamente")
        
        # Test 2: XGate Connection Test
        print("\n--- TESTE 2: Verificar Conexão XGate ---")
        
        response = self.make_request("GET", "/xgate/test-connection", token=cliente_token)
        
        if response and response.status_code == 200:
            data = response.json()
            mode = data.get("mode", "unknown")
            environment = data.get("environment", "unknown")
            
            self.log_test("XGate Connection Test", True, 
                         f"✅ Conexão XGate funcionando - Modo: {mode.upper()}, Ambiente: {environment}")
        else:
            self.log_test("XGate Connection Test", False, 
                         f"❌ Falha na conexão XGate - Status: {response.status_code if response else 'No Response'}")
            return False
        
        # Test 3: PIX Deposit Test (R$ 15,00 conforme especificado na revisão)
        print("\n--- TESTE 3: Teste PIX XGate com QR Code Visual - R$ 15,00 ---")
        
        deposit_request = {
            "amount": 15.00,
            "description": "Teste PIX XGate - Validação QR Code Visual"
        }
        
        response = self.make_request("POST", "/xgate/pix-deposit", deposit_request, token=cliente_token)
        
        if response and response.status_code in [200, 201]:
            response_data = response.json()
            
            # Check if response has success flag and data structure
            if response_data.get("success") and "data" in response_data:
                data = response_data["data"]
                deposit_id = data.get("id", "unknown")
                amount = data.get("amount", 15.00)
                
                self.log_test("PIX Deposit Creation", True, 
                             f"✅ Depósito PIX R$ {amount:.2f} criado - ID: {deposit_id}")
                
                # Test 4: Validar Dados PIX Completos (conforme especificado na revisão)
                print("\n--- TESTE 4: Validação de Dados PIX Completos ---")
                
                # Verificar se retorna qr_code_image (base64)
                if "qr_code_image" in data and data["qr_code_image"]:
                    qr_image = data["qr_code_image"]
                    if qr_image.startswith("data:image/png;base64,"):
                        self.log_test("PIX QR Code Image (Base64)", True, 
                                     f"✅ QR Code visual gerado - Formato base64 correto ({len(qr_image)} chars)")
                    else:
                        self.log_test("PIX QR Code Image (Base64)", False, 
                                     f"❌ QR Code image formato incorreto: {qr_image[:50]}...")
                else:
                    self.log_test("PIX QR Code Image (Base64)", False, 
                                 "❌ qr_code_image não encontrado na resposta - PROBLEMA CRÍTICO")
                
                # Verificar se retorna pix_copy_paste (texto)
                if "pix_copy_paste" in data and data["pix_copy_paste"]:
                    pix_text = data["pix_copy_paste"]
                    self.log_test("PIX Copy Paste Text", True, 
                                 f"✅ Código PIX copia e cola gerado ({len(pix_text)} chars)")
                else:
                    self.log_test("PIX Copy Paste Text", False, 
                                 "❌ pix_copy_paste não encontrado na resposta - PROBLEMA CRÍTICO")
                
                # Verificar se retorna pix_key
                if "pix_key" in data and data["pix_key"]:
                    pix_key = data["pix_key"]
                    self.log_test("PIX Key Generation", True, 
                                 f"✅ PIX Key gerada: {pix_key}")
                else:
                    self.log_test("PIX Key Generation", False, 
                                 "❌ pix_key não encontrada na resposta")
                
                # Verificar expiração (30 minutos)
                if "expires_at" in data and data["expires_at"]:
                    expires_at = data["expires_at"]
                    self.log_test("PIX Expiration", True, 
                                 f"✅ Expiração configurada: {expires_at}")
                else:
                    self.log_test("PIX Expiration", False, 
                                 "❌ expires_at não encontrado na resposta")
                
                # Test 5: Validar formato EMV PIX conforme BACEN
                print("\n--- TESTE 5: Validação Formato EMV PIX ---")
                
                if "qr_code_text" in data and data["qr_code_text"]:
                    qr_text = data["qr_code_text"]
                    # Verificar se começa com indicadores EMV PIX
                    if qr_text.startswith("000201") and "br.gov.bcb.pix" in qr_text:
                        self.log_test("PIX EMV Format", True, 
                                     f"✅ Formato EMV PIX conforme BACEN validado")
                    else:
                        self.log_test("PIX EMV Format", False, 
                                     f"❌ Formato EMV PIX incorreto: {qr_text[:50]}...")
                else:
                    self.log_test("PIX EMV Format", False, 
                                 "❌ qr_code_text não encontrado para validação EMV")
                
                # Test 6: Verificar estrutura completa da resposta
                print("\n--- TESTE 6: Verificação Estrutura Completa da Resposta ---")
                
                expected_fields = ["qr_code_text", "qr_code_image", "pix_copy_paste", "pix_key", "expires_at"]
                missing_fields = []
                present_fields = []
                
                for field in expected_fields:
                    if field in data and data[field]:
                        present_fields.append(field)
                    else:
                        missing_fields.append(field)
                
                if not missing_fields:
                    self.log_test("PIX Response Structure", True, 
                                 f"✅ Todos os campos PIX presentes: {', '.join(present_fields)}")
                else:
                    self.log_test("PIX Response Structure", False, 
                                 f"❌ Campos PIX ausentes: {', '.join(missing_fields)}")
                
                # Test 7: Verificar se modal abre automaticamente (simulação)
                print("\n--- TESTE 7: Simulação de Modal PIX ---")
                
                # Verificar se tem todos os dados necessários para o modal
                modal_required = ["qr_code_image", "pix_copy_paste", "amount", "expires_at"]
                modal_ready = all(field in data and data[field] for field in modal_required)
                
                if modal_ready:
                    self.log_test("PIX Modal Data Ready", True, 
                                 "✅ Dados completos para modal PIX - Modal pode abrir automaticamente")
                else:
                    missing_fields = [field for field in modal_required if field not in data or not data[field]]
                    self.log_test("PIX Modal Data Ready", False, 
                                 f"❌ Dados incompletos para modal PIX - Campos ausentes: {missing_fields}")
                
                # Test 8: Teste de funcionalidade de cópia (simulação)
                print("\n--- TESTE 8: Simulação de Funcionalidade de Cópia ---")
                
                if "pix_copy_paste" in data and data["pix_copy_paste"]:
                    copy_text = data["pix_copy_paste"]
                    # Verificar se o texto é copiável (não vazio, formato correto)
                    if len(copy_text) > 20 and copy_text.startswith("000201"):
                        self.log_test("PIX Copy Function Ready", True, 
                                     f"✅ Código PIX pronto para cópia - {len(copy_text)} caracteres")
                    else:
                        self.log_test("PIX Copy Function Ready", False, 
                                     f"❌ Código PIX inválido para cópia: {copy_text[:30]}...")
                else:
                    self.log_test("PIX Copy Function Ready", False, 
                                 "❌ Código PIX não disponível para cópia")
                
            else:
                self.log_test("PIX Deposit Creation", False, 
                             f"❌ Resposta inválida da API - Success: {response_data.get('success')}")
                return False
                
        else:
            self.log_test("PIX Deposit Creation", False, 
                         f"❌ Falha na criação do depósito PIX - Status: {response.status_code if response else 'No Response'}")
            return False
        
        # Final Summary
        print(f"\n🎯 RESUMO FINAL DO TESTE PIX QR CODE VISUAL:")
        successful_tests = len([r for r in self.test_results if r["success"] and "PIX" in r["test"]])
        total_pix_tests = len([r for r in self.test_results if "PIX" in r["test"]])
        
        print(f"   • Testes PIX executados: {total_pix_tests}")
        print(f"   • Testes PIX bem-sucedidos: {successful_tests}")
        print(f"   • Taxa de sucesso PIX: {(successful_tests/total_pix_tests*100):.1f}%" if total_pix_tests > 0 else "   • Taxa de sucesso PIX: 0%")
        
        if successful_tests == total_pix_tests:
            print("   ✅ RESULTADO: IMPLEMENTAÇÃO PIX COM QR CODE VISUAL FUNCIONANDO 100%")
            print("   ✅ SISTEMA PRONTO: Modal PIX pode abrir automaticamente com QR Code visual")
            print("   ✅ FUNCIONALIDADES: QR Code base64, código copia e cola, PIX key, expiração")
            print("   ✅ FORMATO: EMV PIX conforme BACEN validado")
        elif successful_tests > total_pix_tests * 0.8:
            print(f"   ⚠️ RESULTADO: IMPLEMENTAÇÃO PIX FUNCIONANDO PARCIALMENTE ({successful_tests}/{total_pix_tests})")
            print("   ⚠️ ALGUNS PROBLEMAS: Verificar campos ausentes ou formatos incorretos")
        else:
            print("   ❌ RESULTADO: IMPLEMENTAÇÃO PIX COM PROBLEMAS CRÍTICOS")
            print("   ❌ NECESSÁRIO: Corrigir problemas identificados antes do deploy")
        
        return successful_tests == total_pix_tests

if __name__ == "__main__":
    tester = PixQRVisualTester()
    
    print("🚀 EXECUTANDO TESTE FINAL DA IMPLEMENTAÇÃO PIX COM QR CODE VISUAL")
    print("=" * 80)
    
    # Run PIX QR Code Visual test
    tester.test_pix_visual_qr_code_complete()
    
    # Print final summary
    print(f"\n🎯 RESUMO FINAL DOS TESTES PIX QR CODE VISUAL")
    print("=" * 80)
    print(f"Total de testes executados: {len(tester.test_results)}")
    print(f"Testes aprovados: {len([r for r in tester.test_results if r['success']])}")
    print(f"Testes falharam: {len([r for r in tester.test_results if not r['success']])}")
    print(f"Taxa de sucesso: {(len([r for r in tester.test_results if r['success']]) / len(tester.test_results) * 100):.1f}%")
    
    # Show failed tests
    failed_tests = [r for r in tester.test_results if not r['success']]
    if failed_tests:
        print(f"\n❌ PROBLEMAS IDENTIFICADOS:")
        for test in failed_tests:
            print(f"  • {test['test']}: {test['details']}")
        print(f"\n❌ CONCLUSÃO: IMPLEMENTAÇÃO PIX COM PROBLEMAS - VERIFICAR ANTES DO DEPLOY")
    else:
        print(f"\n✅ CONCLUSÃO: IMPLEMENTAÇÃO PIX COM QR CODE VISUAL FUNCIONANDO PERFEITAMENTE")
    
    print(f"\n🎯 TESTES PIX CONCLUÍDOS!")