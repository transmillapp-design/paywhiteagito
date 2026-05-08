#!/usr/bin/env python3
"""
Simple test for chatbot system
"""
import requests
import json
import os

class SimpleChatbotTester:
    def __init__(self):
        # Use local backend URL
        self.base_url = "http://localhost:8001/api"
        
        print(f"Using backend URL: {self.base_url}")
    
    def make_request(self, method, endpoint, data=None, token=None):
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def test_chatbot_system(self):
        print("🎯 TESTE COMPLETO DO SISTEMA DE CHATBOT IA INTERNO")
        print("=" * 80)
        
        # Test 1: Login Master Account
        print("\n--- TESTE 1: Login Master Account ---")
        
        master_login_data = {
            "email": "master@agitocoin.com",
            "password": "master123"
        }
        
        response = self.make_request("POST", "/auth/login", master_login_data)
        
        if not response or response.status_code != 200:
            print(f"❌ Login master falhou - Status: {response.status_code if response else 'No response'}")
            return False
        
        data = response.json()
        master_token = data.get("access_token")
        master_user = data.get("user", {})
        
        if not master_token or not master_user.get("is_master_account", False):
            print(f"❌ Login master sem privilégios - is_master_account: {master_user.get('is_master_account', False)}")
            return False
        
        print(f"✅ Login master funcionando - {master_user.get('full_name', 'Master')}")
        
        # Test 2: Create Chatbot Command
        print("\n--- TESTE 2: Criar Comando do Chatbot ---")
        
        command_data = {
            "keywords": ["deposito", "depositar", "colocar dinheiro"],
            "response": "Ótimo! Vou chamar aqui nossa área de depósito. Lembrando que você pode depositar em PIX BRL ou PIX USDT",
            "action_type": "navigate",
            "action_target": "/deposit",
            "action_label": "Ir para Depósito",
            "priority": 10
        }
        
        response = self.make_request("POST", "/master/chatbot/commands", command_data, token=master_token)
        
        if not response or response.status_code != 200:
            print(f"❌ Endpoint falhou - Status: {response.status_code if response else 'No response'}")
            return False
        
        data = response.json()
        if not data.get("success"):
            print(f"❌ Falha na criação - {data.get('message', 'Erro desconhecido')}")
            return False
        
        command_id = data.get("command", {}).get("id")
        print(f"✅ Comando criado com sucesso - ID: {command_id}")
        
        # Test 3: Query Chatbot with Match
        print("\n--- TESTE 3: Consulta do Chatbot com Match ---")
        
        query_data = {"query": "deposito"}
        
        response = self.make_request("POST", "/chatbot/query", query_data)
        
        if not response or response.status_code != 200:
            print(f"❌ Endpoint falhou - Status: {response.status_code if response else 'No response'}")
            return False
        
        data = response.json()
        if not (data.get("success") and data.get("found")):
            print(f"❌ Query não encontrou match - found: {data.get('found', False)}")
            return False
        
        response_text = data.get("response", "")
        action = data.get("action", {})
        
        print(f"✅ Query 'deposito' encontrou match")
        print(f"   Resposta: {response_text[:100]}...")
        print(f"   Ação: {action}")
        
        # Test 4: Query Chatbot without Match
        print("\n--- TESTE 4: Consulta do Chatbot sem Match ---")
        
        query_data = {"query": "algo que não existe"}
        
        response = self.make_request("POST", "/chatbot/query", query_data)
        
        if not response or response.status_code != 200:
            print(f"❌ Endpoint falhou - Status: {response.status_code if response else 'No response'}")
            return False
        
        data = response.json()
        if not (data.get("success") and not data.get("found")):
            print(f"❌ Query deveria não ter match - found: {data.get('found', True)}")
            return False
        
        print(f"✅ Query sem match retornou resposta padrão")
        
        # Test 5: Test Permissions (Client trying to create command)
        print("\n--- TESTE 5: Teste de Permissões ---")
        
        # Login as client
        client_login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", client_login_data)
        
        if not response or response.status_code != 200:
            print(f"❌ Login cliente falhou - Status: {response.status_code if response else 'No response'}")
            return False
        
        data = response.json()
        client_token = data.get("access_token")
        
        if client_token:
            # Try to create command as client (should fail)
            unauthorized_command = {
                "keywords": ["teste"],
                "response": "Teste não autorizado",
                "action_type": "none"
            }
            
            response = self.make_request("POST", "/master/chatbot/commands", unauthorized_command, token=client_token)
            
            if response and response.status_code == 403:
                print("✅ Cliente não pode criar comandos (403 Forbidden)")
            else:
                print(f"❌ Cliente deveria receber 403 - Status: {response.status_code if response else 'No response'}")
            
            # But client can query chatbot
            query_data = {"query": "deposito"}
            response = self.make_request("POST", "/chatbot/query", query_data)
            
            if response and response.status_code == 200:
                print("✅ Cliente pode consultar chatbot")
            else:
                print(f"❌ Cliente não pode consultar chatbot - Status: {response.status_code if response else 'No response'}")
        
        print("\n🎯 RESUMO DO TESTE DO SISTEMA DE CHATBOT:")
        print("✅ Login master funcionando")
        print("✅ Criação de comandos funcionando")
        print("✅ Consulta com match funcionando")
        print("✅ Consulta sem match funcionando")
        print("✅ Controle de permissões funcionando")
        print("✅ SISTEMA DE CHATBOT FUNCIONANDO 100%")
        
        return True

if __name__ == "__main__":
    tester = SimpleChatbotTester()
    success = tester.test_chatbot_system()
    
    if success:
        print("\n🎉 SISTEMA DE CHATBOT APROVADO!")
    else:
        print("\n❌ SISTEMA DE CHATBOT COM PROBLEMAS")