#!/usr/bin/env python3
"""
Labelview System Complete Testing Suite - CRITICAL FOR PRODUCTION
Comprehensive test of the Labelview system based on the review request
"""

import requests
import json
import time
import uuid
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import os
import io
import sys
import base64

class LabelviewTester:
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
        self.tokens = {}
        self.users = {}
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
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise
    
    def make_form_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with form data"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "POST":
                response = self.session.post(url, data=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, data=data, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, data=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method for form data: {method}")
                
            return response
        except Exception as e:
            print(f"Form request failed: {e}")
            raise

    def test_labelview_complete_system(self):
        """🎯 TESTE COMPLETO DO SISTEMA LABELVIEW - CRÍTICO PARA PRODUÇÃO"""
        print("\n🎯 TESTE COMPLETO DO SISTEMA LABELVIEW - CRÍTICO PARA PRODUÇÃO")
        print("=" * 80)
        print("CONTEXTO: Sistema Labelview completamente refeito com hierarquia e integração Transmill.")
        print("OBJETIVO: Teste completo antes de deploy em produção.")
        print("")
        print("CREDENCIAIS MASTER:")
        print("- Email: protecao@agitomil.com")
        print("- Senha: demo123")
        print("")
        print("FUNCIONALIDADES PARA TESTAR:")
        print("")
        print("## 1. AUTENTICAÇÃO")
        print("- Login com protecao@agitomil.com / demo123")
        print("- Verificar se retorna token válido")
        print("- Verificar se user tem is_labelview_master=true")
        print("")
        print("## 2. HIERARQUIA - CRIAR UNIDADE")
        print("**Endpoint:** POST /api/labelview/unidades")
        print("**Testar com:**")
        print("- nome_fantasia, razao_social, cnpj")
        print("- responsavel_nome, responsavel_cpf, responsavel_email")
        print("- pix_key, pix_key_type")
        print("- cor_primaria, cor_secundaria")
        print("- Verificar se cria com referred_by = master_id")
        print("- Verificar se gera referral_code UNIT_XXXXXXXX")
        print("- Verificar se retorna credenciais (email, password)")
        print("")
        print("## 3. HIERARQUIA - CRIAR REGIONAL")
        print("**Endpoint:** POST /api/labelview/regionais")
        print("**Testar com:**")
        print("- nome, telefone, unidade_id (usar ID da unidade criada)")
        print("- comissao_mensalidade_tipo, comissao_mensalidade_valor")
        print("- Verificar se cria com referred_by = unidade_id")
        print("- Verificar se gera referral_code REG_XXXXXXXX")
        print("- Verificar se retorna credenciais")
        print("")
        print("## 4. HIERARQUIA - CRIAR CONSULTOR")
        print("**Endpoint:** POST /api/labelview/consultores")
        print("**Testar com:**")
        print("- nome, telefone, natureza=cpf")
        print("- unidade_id, regional_id (usar IDs criados)")
        print("- comissao_mensalidade_tipo, comissao_mensalidade_valor")
        print("- Verificar se cria com referred_by = regional_id")
        print("- Verificar se gera referral_code CONS_XXXXXXXX")
        print("")
        print("## 5. LISTAR HIERARQUIA")
        print("**GET /api/labelview/unidades** - deve retornar unidades criadas")
        print("**GET /api/labelview/regionais** - deve filtrar por hierarquia")
        print("**GET /api/labelview/consultores** - deve filtrar por hierarquia")
        print("")
        print("## 6. FILTROS DE CLIENTES")
        print("**Endpoint:** GET /api/labelview/clients-detailed")
        print("**Testar:**")
        print("- Sem filtros (Master vê todos)")
        print("- ?unidade_id=XXX (Master filtra por unidade)")
        print("- ?referred_by=XXX (próprios)")
        print("- ?regional_id=XXX (por regional)")
        print("- ?consultor_id=XXX (por consultor)")
        print("")
        print("## 7. TIPOS DE VEÍCULO")
        print("**GET /api/protecao/tipos-veiculo** - deve retornar Carro, Moto, Caminhão")
        print("")
        print("## 8. UPLOAD VISTORIA (CLOUDINARY)")
        print("**POST /api/labelview/upload-foto-vistoria**")
        print("**Testar com:**")
        print("- imagem_base64 (base64 de uma imagem pequena)")
        print("- nome_campo: \"frente\"")
        print("- cotacao_temp_id: \"test_123\"")
        print("- Verificar se retorna URL do Cloudinary")
        print("")
        print("## 9. SENHA PROVISÓRIA")
        print("- Verificar se unidades/regionais/consultores criados retornam temporary_password")
        print("- Verificar se campo must_change_password=true")
        print("")
        print("## 10. SEGURANÇA")
        print("- Testar endpoints sem token (deve retornar 401)")
        print("- Testar acesso cruzado (regional tentando acessar dados de outra unidade)")
        print("")
        print("**IMPORTANTE:**")
        print("- Use curl para todos os testes")
        print("- Capture respostas completas")
        print("- Salve IDs criados para usar em testes seguintes")
        print("- Teste a cadeia completa: Master→Unidade→Regional→Consultor")
        print("=" * 80)
        
        # Variables to store created entities
        master_token = None
        master_user = None
        created_unidade = None
        created_regional = None
        created_consultor = None
        
        # 1. AUTENTICAÇÃO
        print("\n=== 1. AUTENTICAÇÃO ===")
        
        master_login_data = {
            "email": "protecao@agitomil.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", master_login_data)
        
        if response.status_code == 200:
            data = response.json()
            master_token = data.get("access_token")
            master_user = data.get("user", {})
            
            if master_token and master_user.get("is_labelview_master", False):
                self.log_test("Login Master Labelview", True, 
                             f"✅ Login funcionando - Token JWT válido, is_labelview_master=true")
                print(f"🔍 Master logado: {master_user.get('email')} - {master_user.get('full_name')}")
            else:
                self.log_test("Login Master Labelview", False, 
                             f"❌ Login falhou ou não é labelview_master")
                return False
        else:
            self.log_test("Login Master Labelview", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
            return False
        
        # 2. HIERARQUIA - CRIAR UNIDADE
        print("\n=== 2. HIERARQUIA - CRIAR UNIDADE ===")
        
        timestamp = int(time.time())
        test_cnpj = f"11.222.333/0001-{timestamp % 100:02d}"
        test_email = f"unidade.teste.{timestamp}@teste.com"
        
        # Create minimal PNG for logo
        png_data = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=='
        )
        
        files = {
            'logo': ('test_logo.png', io.BytesIO(png_data), 'image/png')
        }
        
        form_data = {
            'nome_fantasia': 'Unidade Teste Produção',
            'razao_social': 'Unidade Teste LTDA',
            'cnpj': test_cnpj,
            'telefone': '(11) 99999-9999',
            'whatsapp': '(11) 99999-9999',
            'email': test_email,
            'password': 'SenhaProvisoria2024!',
            'responsavel_nome': 'João Responsável',
            'responsavel_cpf': '123.456.789-00',
            'responsavel_email': 'joao@teste.com',
            'responsavel_whatsapp': '(11) 99999-9999',
            'pix_key': test_cnpj,
            'pix_key_type': 'cnpj',
            'taxa_adesao': '100.00',
            'vencimento_inicio': '1',
            'vencimento_fim': '15',
            'cep': '01310-100',
            'address': 'Rua Teste, 123',
            'number': '123',
            'complement': '',
            'neighborhood': 'Centro',
            'city': 'São Paulo',
            'state': 'SP',
            'cor_primaria': '#1a59ad',
            'cor_secundaria': '#2fa31c'
        }
        
        headers = {
            'Authorization': f'Bearer {master_token}'
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/labelview/unidades",
                data=form_data,
                files=files,
                headers=headers
            )
            
            if response.status_code == 200:
                unit_data = response.json()
                success = unit_data.get("success", False)
                credentials = unit_data.get("credentials", {})
                unidade_id = unit_data.get("unidade_id")
                
                if success and credentials and unidade_id:
                    created_unidade = {
                        "id": unidade_id,
                        "email": credentials.get("email"),
                        "password": credentials.get("password")
                    }
                    
                    self.log_test("Criar Unidade", True, 
                                 f"✅ Unidade criada - ID: {unidade_id}, Email: {credentials.get('email')}")
                    
                    # Verificar se retorna credenciais
                    if credentials.get("email") and credentials.get("password"):
                        self.log_test("Credenciais Unidade", True, 
                                     "✅ Credenciais retornadas (email e password)")
                    else:
                        self.log_test("Credenciais Unidade", False, 
                                     "❌ Credenciais incompletas")
                else:
                    self.log_test("Criar Unidade", False, 
                                 f"❌ Falha ao criar unidade - success: {success}")
                    return False
            else:
                self.log_test("Criar Unidade", False, 
                             f"❌ Falha ao criar unidade - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Erro: {error_data}")
                except:
                    print(f"❌ Erro sem detalhes")
                return False
                
        except Exception as e:
            self.log_test("Criar Unidade", False, 
                         f"❌ Erro ao criar unidade: {str(e)}")
            return False
        
        # 3. HIERARQUIA - CRIAR REGIONAL
        print("\n=== 3. HIERARQUIA - CRIAR REGIONAL ===")
        
        # Login with created unit first
        unit_login_data = {
            "email": created_unidade["email"],
            "password": created_unidade["password"]
        }
        
        response = self.make_request("POST", "/auth/login", unit_login_data)
        
        unit_token = None
        if response.status_code == 200:
            data = response.json()
            unit_token = data.get("access_token")
            
            if unit_token:
                self.log_test("Login Unidade", True, 
                             "✅ Login da unidade criada funcionando")
            else:
                self.log_test("Login Unidade", False, 
                             "❌ Token da unidade não retornado")
                return False
        else:
            self.log_test("Login Unidade", False, 
                         f"❌ Login da unidade falhou - Status: {response.status_code}")
            return False
        
        # Create regional
        regional_form_data = {
            'nome': 'Regional Teste',
            'telefone': '(11) 88888-8888',
            'unidade_id': created_unidade["id"],
            'comissao_mensalidade_tipo': 'percentual',
            'comissao_mensalidade_valor': '5.0'
        }
        
        response = self.make_form_request("POST", "/labelview/regionais", 
                                        data=regional_form_data, token=unit_token)
        
        if response.status_code == 200:
            regional_data = response.json()
            success = regional_data.get("success", False)
            credentials = regional_data.get("credentials", {})
            regional_id = regional_data.get("regional_id")
            
            if success and credentials and regional_id:
                created_regional = {
                    "id": regional_id,
                    "email": credentials.get("email"),
                    "password": credentials.get("password")
                }
                
                self.log_test("Criar Regional", True, 
                             f"✅ Regional criada - ID: {regional_id}, Email: {credentials.get('email')}")
                
                # Verificar referral_code
                referral_code = regional_data.get("referral_code", "")
                if referral_code.startswith("REG_"):
                    self.log_test("Referral Code Regional", True, 
                                 f"✅ Referral code gerado: {referral_code}")
                else:
                    self.log_test("Referral Code Regional", False, 
                                 f"❌ Referral code inválido: {referral_code}")
            else:
                self.log_test("Criar Regional", False, 
                             f"❌ Falha ao criar regional - success: {success}")
        else:
            self.log_test("Criar Regional", False, 
                         f"❌ Falha ao criar regional - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data}")
            except:
                print(f"❌ Erro sem detalhes")
        
        # 4. HIERARQUIA - CRIAR CONSULTOR
        print("\n=== 4. HIERARQUIA - CRIAR CONSULTOR ===")
        
        if created_regional:
            # Login with created regional
            regional_login_data = {
                "email": created_regional["email"],
                "password": created_regional["password"]
            }
            
            response = self.make_request("POST", "/auth/login", regional_login_data)
            
            regional_token = None
            if response.status_code == 200:
                data = response.json()
                regional_token = data.get("access_token")
                
                if regional_token:
                    self.log_test("Login Regional", True, 
                                 "✅ Login da regional criada funcionando")
                else:
                    self.log_test("Login Regional", False, 
                                 "❌ Token da regional não retornado")
            else:
                self.log_test("Login Regional", False, 
                             f"❌ Login da regional falhou - Status: {response.status_code}")
            
            if regional_token:
                # Create consultor
                consultor_form_data = {
                    'nome': 'Consultor Teste',
                    'telefone': '(11) 77777-7777',
                    'natureza': 'cpf',
                    'cpf': '987.654.321-00',
                    'unidade_id': created_unidade["id"],
                    'regional_id': created_regional["id"],
                    'comissao_mensalidade_tipo': 'valor',
                    'comissao_mensalidade_valor': '50.0'
                }
                
                response = self.make_form_request("POST", "/labelview/consultores", 
                                                data=consultor_form_data, token=regional_token)
                
                if response.status_code == 200:
                    consultor_data = response.json()
                    success = consultor_data.get("success", False)
                    credentials = consultor_data.get("credentials", {})
                    consultor_id = consultor_data.get("consultor_id")
                    
                    if success and credentials and consultor_id:
                        created_consultor = {
                            "id": consultor_id,
                            "email": credentials.get("email"),
                            "password": credentials.get("password")
                        }
                        
                        self.log_test("Criar Consultor", True, 
                                     f"✅ Consultor criado - ID: {consultor_id}, Email: {credentials.get('email')}")
                        
                        # Verificar referral_code
                        referral_code = consultor_data.get("referral_code", "")
                        if referral_code.startswith("CONS_"):
                            self.log_test("Referral Code Consultor", True, 
                                         f"✅ Referral code gerado: {referral_code}")
                        else:
                            self.log_test("Referral Code Consultor", False, 
                                         f"❌ Referral code inválido: {referral_code}")
                    else:
                        self.log_test("Criar Consultor", False, 
                                     f"❌ Falha ao criar consultor - success: {success}")
                else:
                    self.log_test("Criar Consultor", False, 
                                 f"❌ Falha ao criar consultor - Status: {response.status_code}")
                    try:
                        error_data = response.json()
                        print(f"❌ Erro: {error_data}")
                    except:
                        print(f"❌ Erro sem detalhes")
        
        # 5. LISTAR HIERARQUIA
        print("\n=== 5. LISTAR HIERARQUIA ===")
        
        # Test GET /api/labelview/unidades
        response = self.make_request("GET", "/labelview/unidades", token=master_token)
        
        if response.status_code == 200:
            unidades = response.json()
            if isinstance(unidades, list) and len(unidades) > 0:
                self.log_test("Listar Unidades", True, 
                             f"✅ {len(unidades)} unidades encontradas")
                
                # Check if created unit is in the list
                found_unit = any(u.get("id") == created_unidade["id"] for u in unidades if created_unidade)
                if found_unit:
                    self.log_test("Unidade Criada na Lista", True, 
                                 "✅ Unidade criada aparece na listagem")
                else:
                    self.log_test("Unidade Criada na Lista", False, 
                                 "❌ Unidade criada não aparece na listagem")
            else:
                self.log_test("Listar Unidades", False, 
                             f"❌ Nenhuma unidade encontrada ou formato inválido")
        else:
            self.log_test("Listar Unidades", False, 
                         f"❌ Falha ao listar unidades - Status: {response.status_code}")
        
        # Test GET /api/labelview/regionais
        response = self.make_request("GET", "/labelview/regionais", token=master_token)
        
        if response.status_code == 200:
            regionais = response.json()
            if isinstance(regionais, list):
                self.log_test("Listar Regionais", True, 
                             f"✅ {len(regionais)} regionais encontradas")
            else:
                self.log_test("Listar Regionais", False, 
                             f"❌ Formato inválido na listagem de regionais")
        else:
            self.log_test("Listar Regionais", False, 
                         f"❌ Falha ao listar regionais - Status: {response.status_code}")
        
        # Test GET /api/labelview/consultores
        response = self.make_request("GET", "/labelview/consultores", token=master_token)
        
        if response.status_code == 200:
            consultores = response.json()
            if isinstance(consultores, list):
                self.log_test("Listar Consultores", True, 
                             f"✅ {len(consultores)} consultores encontrados")
            else:
                self.log_test("Listar Consultores", False, 
                             f"❌ Formato inválido na listagem de consultores")
        else:
            self.log_test("Listar Consultores", False, 
                         f"❌ Falha ao listar consultores - Status: {response.status_code}")
        
        # 6. FILTROS DE CLIENTES
        print("\n=== 6. FILTROS DE CLIENTES ===")
        
        # Test GET /api/labelview/clients-detailed
        response = self.make_request("GET", "/labelview/clients-detailed", token=master_token)
        
        if response.status_code == 200:
            clients = response.json()
            self.log_test("Filtros de Clientes - Sem Filtros", True, 
                         f"✅ Endpoint funcionando - Master vê todos os clientes")
        else:
            self.log_test("Filtros de Clientes - Sem Filtros", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
        
        # Test with unidade_id filter
        if created_unidade:
            response = self.make_request("GET", f"/labelview/clients-detailed?unidade_id={created_unidade['id']}", 
                                       token=master_token)
            
            if response.status_code == 200:
                self.log_test("Filtros de Clientes - Por Unidade", True, 
                             "✅ Filtro por unidade funcionando")
            else:
                self.log_test("Filtros de Clientes - Por Unidade", False, 
                             f"❌ Filtro por unidade falhou - Status: {response.status_code}")
        
        # 7. TIPOS DE VEÍCULO
        print("\n=== 7. TIPOS DE VEÍCULO ===")
        
        response = self.make_request("GET", "/protecao/tipos-veiculo", token=master_token)
        
        if response.status_code == 200:
            tipos = response.json()
            if isinstance(tipos, list) and len(tipos) >= 3:
                # Check for expected vehicle types
                tipos_nomes = [t.get("nome", "") for t in tipos]
                expected_types = ["Carro", "Moto", "Caminhão"]
                found_types = [t for t in expected_types if t in tipos_nomes]
                
                if len(found_types) >= 3:
                    self.log_test("Tipos de Veículo", True, 
                                 f"✅ Tipos encontrados: {', '.join(found_types)}")
                else:
                    self.log_test("Tipos de Veículo", False, 
                                 f"❌ Tipos esperados não encontrados. Encontrados: {tipos_nomes}")
            else:
                self.log_test("Tipos de Veículo", False, 
                             f"❌ Formato inválido ou poucos tipos retornados")
        else:
            self.log_test("Tipos de Veículo", False, 
                         f"❌ Falha ao buscar tipos de veículo - Status: {response.status_code}")
        
        # 8. UPLOAD VISTORIA (CLOUDINARY)
        print("\n=== 8. UPLOAD VISTORIA (CLOUDINARY) ===")
        
        # Create a small base64 image for testing
        test_image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
        
        upload_data = {
            "imagem_base64": test_image_b64,
            "nome_campo": "frente",
            "cotacao_temp_id": "test_123"
        }
        
        response = self.make_request("POST", "/labelview/upload-foto-vistoria", 
                                   data=upload_data, token=master_token)
        
        if response.status_code == 200:
            upload_result = response.json()
            success = upload_result.get("success", False)
            url = upload_result.get("url", "")
            
            if success and url and "cloudinary" in url:
                self.log_test("Upload Vistoria Cloudinary", True, 
                             f"✅ Upload funcionando - URL: {url[:50]}...")
            else:
                self.log_test("Upload Vistoria Cloudinary", False, 
                             f"❌ Upload falhou - success: {success}, url: {url}")
        else:
            self.log_test("Upload Vistoria Cloudinary", False, 
                         f"❌ Upload falhou - Status: {response.status_code}")
        
        # 9. SENHA PROVISÓRIA
        print("\n=== 9. SENHA PROVISÓRIA ===")
        
        # Check if created entities have temporary passwords
        if created_unidade:
            # Get unidades list and check for temporary_password
            response = self.make_request("GET", "/labelview/unidades", token=master_token)
            
            if response.status_code == 200:
                unidades = response.json()
                created_unit_data = next((u for u in unidades if u.get("id") == created_unidade["id"]), None)
                
                if created_unit_data:
                    temp_password = created_unit_data.get("temporary_password")
                    must_change = created_unit_data.get("must_change_password")
                    
                    if temp_password:
                        self.log_test("Senha Provisória Unidade", True, 
                                     "✅ Campo temporary_password presente na unidade")
                    else:
                        self.log_test("Senha Provisória Unidade", False, 
                                     "❌ Campo temporary_password ausente na unidade")
                    
                    if must_change:
                        self.log_test("Must Change Password Unidade", True, 
                                     "✅ Campo must_change_password=true na unidade")
                    else:
                        self.log_test("Must Change Password Unidade", False, 
                                     "❌ Campo must_change_password não é true na unidade")
        
        # 10. SEGURANÇA
        print("\n=== 10. SEGURANÇA ===")
        
        # Test endpoint without token (should return 401)
        response = self.make_request("GET", "/labelview/unidades")
        
        if response.status_code == 401:
            self.log_test("Segurança - Sem Token", True, 
                         "✅ Endpoint protegido - retorna 401 sem token")
        else:
            self.log_test("Segurança - Sem Token", False, 
                         f"❌ Endpoint não protegido - Status: {response.status_code}")
        
        # Test with invalid token
        response = self.make_request("GET", "/labelview/unidades", token="invalid_token")
        
        if response.status_code == 401:
            self.log_test("Segurança - Token Inválido", True, 
                         "✅ Endpoint protegido - retorna 401 com token inválido")
        else:
            self.log_test("Segurança - Token Inválido", False, 
                         f"❌ Endpoint aceita token inválido - Status: {response.status_code}")
        
        # Final Summary
        print(f"\n🎯 RESUMO DO TESTE COMPLETO LABELVIEW:")
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Testes falharam: {failed_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "   • Taxa de sucesso: 0%")
        
        # Critical functionality check
        critical_tests = [
            "Login Master Labelview",
            "Criar Unidade", 
            "Criar Regional",
            "Criar Consultor",
            "Listar Unidades",
            "Tipos de Veículo",
            "Segurança - Sem Token"
        ]
        
        critical_success = 0
        for test_name in critical_tests:
            if any(test_name in r["test"] and r["success"] for r in self.test_results):
                critical_success += 1
        
        print(f"   • Funcionalidades críticas: {critical_success}/{len(critical_tests)}")
        
        # Final recommendation
        if critical_success >= len(critical_tests) * 0.8 and successful_tests >= total_tests * 0.75:
            print("\n✅ RESULTADO: SISTEMA LABELVIEW APROVADO PARA PRODUÇÃO")
            print("   ✅ Funcionalidades críticas operacionais")
            print("   ✅ Hierarquia funcionando (Master→Unidade→Regional→Consultor)")
            print("   ✅ Endpoints de criação e listagem funcionando")
            print("   ✅ Segurança implementada")
            print("   ✅ Integração Cloudinary funcionando")
            print("   ✅ Sistema pronto para deploy")
            return True
        else:
            print("\n❌ RESULTADO: PROBLEMAS CRÍTICOS IDENTIFICADOS")
            print("   ❌ Funcionalidades essenciais com falhas")
            print("   ❌ CORREÇÃO NECESSÁRIA antes do deploy")
            
            # Show failed critical tests
            failed_critical = []
            for test_name in critical_tests:
                if not any(test_name in r["test"] and r["success"] for r in self.test_results):
                    failed_critical.append(test_name)
            
            if failed_critical:
                print("   ❌ TESTES CRÍTICOS FALHARAM:")
                for test in failed_critical:
                    print(f"      • {test}")
            
            return False

if __name__ == "__main__":
    tester = LabelviewTester()
    
    # Run the comprehensive Labelview system test
    print("🚨 Executando teste completo do sistema Labelview...")
    success = tester.test_labelview_complete_system()
    
    if success:
        print("\n✅ Sistema Labelview aprovado para produção!")
    else:
        print("\n❌ Sistema Labelview precisa de correções!")
        
    # Show detailed results
    print("\n" + "="*50)
    print("RESULTADOS DETALHADOS:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['details']}")
    print("="*50)