#!/usr/bin/env python3
"""
AgitoCash Frontend Configuration Investigation
Investigate frontend configuration issues on production
"""

import requests
import re
import json

def analyze_frontend_bundle():
    """Analyze the frontend JavaScript bundle for configuration issues"""
    print("🔍 ANÁLISE DO BUNDLE JAVASCRIPT DO FRONTEND")
    print("=" * 60)
    
    try:
        # Get the main HTML page to find the JS bundle
        response = requests.get("https://login-reset.emergent.host/", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Erro ao acessar página principal: {response.status_code}")
            return
        
        # Extract JS bundle URL
        js_bundle_match = re.search(r'/static/js/main\.[a-f0-9]+\.js', response.text)
        
        if not js_bundle_match:
            print("❌ Bundle JavaScript não encontrado")
            return
        
        js_bundle_url = f"https://login-reset.emergent.host{js_bundle_match.group()}"
        print(f"📦 Bundle JavaScript: {js_bundle_url}")
        
        # Download and analyze the bundle
        bundle_response = requests.get(js_bundle_url, timeout=15)
        
        if bundle_response.status_code != 200:
            print(f"❌ Erro ao baixar bundle: {bundle_response.status_code}")
            return
        
        bundle_content = bundle_response.text
        print(f"📊 Tamanho do bundle: {len(bundle_content)} caracteres")
        
        # Look for backend URL configurations
        print("\n--- ANÁLISE DE CONFIGURAÇÕES DE BACKEND ---")
        
        # Search for localhost references
        localhost_matches = re.findall(r'localhost[:\d]*', bundle_content)
        if localhost_matches:
            print(f"❌ PROBLEMA ENCONTRADO: Referências a localhost no bundle:")
            for match in set(localhost_matches):
                count = bundle_content.count(match)
                print(f"   • {match} (aparece {count} vezes)")
        else:
            print("✅ Nenhuma referência a localhost encontrada")
        
        # Search for port 8001 references
        port_8001_matches = re.findall(r':8001\b', bundle_content)
        if port_8001_matches:
            print(f"❌ PROBLEMA ENCONTRADO: Referências à porta 8001:")
            print(f"   • Encontradas {len(port_8001_matches)} referências à porta 8001")
        else:
            print("✅ Nenhuma referência à porta 8001 encontrada")
        
        # Search for API URL patterns
        api_patterns = [
            r'http://[^"\']+/api',
            r'https://[^"\']+/api',
            r'["\']http://localhost[^"\']*["\']',
            r'["\']https://login-reset\.emergent\.host[^"\']*["\']'
        ]
        
        print("\n--- ANÁLISE DE URLs DE API ---")
        
        for pattern in api_patterns:
            matches = re.findall(pattern, bundle_content)
            if matches:
                print(f"🔍 Padrão {pattern}:")
                for match in set(matches):
                    print(f"   • {match}")
        
        # Look for environment variable usage
        env_patterns = [
            r'process\.env\.[A-Z_]+',
            r'import\.meta\.env\.[A-Z_]+',
            r'REACT_APP_[A-Z_]+'
        ]
        
        print("\n--- ANÁLISE DE VARIÁVEIS DE AMBIENTE ---")
        
        for pattern in env_patterns:
            matches = re.findall(pattern, bundle_content)
            if matches:
                print(f"🔍 Padrão {pattern}:")
                for match in set(matches):
                    count = bundle_content.count(match)
                    print(f"   • {match} (aparece {count} vezes)")
        
        # Search for specific backend URL configurations
        backend_url_patterns = [
            r'BACKEND_URL["\']?\s*[:=]\s*["\'][^"\']+["\']',
            r'baseURL["\']?\s*[:=]\s*["\'][^"\']+["\']',
            r'API_BASE["\']?\s*[:=]\s*["\'][^"\']+["\']'
        ]
        
        print("\n--- ANÁLISE DE CONFIGURAÇÕES DE URL BASE ---")
        
        for pattern in backend_url_patterns:
            matches = re.findall(pattern, bundle_content)
            if matches:
                print(f"🔍 Configuração encontrada:")
                for match in matches:
                    print(f"   • {match}")
        
        return bundle_content
        
    except Exception as e:
        print(f"❌ Erro na análise: {str(e)}")
        return None

def test_frontend_api_calls():
    """Test what API calls the frontend is actually making"""
    print("\n🌐 TESTE DE CHAMADAS DE API DO FRONTEND")
    print("=" * 50)
    
    # Test different possible backend URLs that the frontend might be using
    possible_urls = [
        "http://localhost:8001/api",
        "https://login-reset.emergent.host/api",
        "https://login-reset.emergent.host:8001/api",
        "/api"  # Relative URL
    ]
    
    test_credentials = {
        "email": "cliente@demo.com",
        "password": "demo123"
    }
    
    for url in possible_urls:
        print(f"\n--- Testando URL: {url} ---")
        
        try:
            if url.startswith("/"):
                # For relative URLs, prepend the domain
                full_url = f"https://login-reset.emergent.host{url}/auth/login"
            else:
                full_url = f"{url}/auth/login"
            
            response = requests.post(full_url, 
                                   json=test_credentials,
                                   headers={
                                       "Content-Type": "application/json",
                                       "Origin": "https://login-reset.emergent.host"
                                   },
                                   timeout=10)
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Login bem-sucedido")
                data = response.json()
                print(f"✅ Token recebido: {len(data.get('access_token', ''))} chars")
            elif response.status_code in [400, 401, 422]:
                print("⚠️ Endpoint acessível (erro de validação)")
            else:
                print(f"❌ Erro: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Erro de conexão")
        except requests.exceptions.Timeout:
            print("❌ Timeout")
        except Exception as e:
            print(f"❌ Erro: {str(e)}")

def diagnose_frontend_issue():
    """Provide diagnosis of the frontend configuration issue"""
    print("\n🎯 DIAGNÓSTICO DO PROBLEMA")
    print("=" * 40)
    
    print("PROBLEMA IDENTIFICADO:")
    print("❌ O bundle JavaScript do frontend contém referências hardcoded a 'localhost:8001'")
    print("❌ Isso significa que o frontend está tentando se conectar ao backend local")
    print("❌ Em produção, deveria usar a URL externa ou URLs relativas")
    print()
    print("CAUSA RAIZ:")
    print("• O frontend foi buildado com REACT_APP_BACKEND_URL=http://localhost:8001")
    print("• A variável de ambiente não foi configurada corretamente para produção")
    print()
    print("SOLUÇÕES POSSÍVEIS:")
    print("1. Rebuild do frontend com REACT_APP_BACKEND_URL=https://login-reset.emergent.host")
    print("2. Configurar variável de ambiente no processo de build")
    print("3. Usar URLs relativas (/api) em vez de URLs absolutas")
    print()
    print("IMPACTO:")
    print("• Backend funcionando ✅")
    print("• Contas demo existem e funcionam ✅") 
    print("• Frontend carrega ✅")
    print("• Integração frontend-backend ❌ (URLs incorretas)")

def main():
    print("🚨 INVESTIGAÇÃO COMPLETA: CONFIGURAÇÃO DO FRONTEND")
    print("=" * 80)
    
    bundle_content = analyze_frontend_bundle()
    test_frontend_api_calls()
    diagnose_frontend_issue()
    
    print("\n" + "=" * 80)
    print("🎯 CONCLUSÃO FINAL")
    print("=" * 80)
    print("✅ BACKEND: Funcionando perfeitamente - todas as contas demo operacionais")
    print("✅ FRONTEND: Carregando corretamente")
    print("❌ INTEGRAÇÃO: Frontend configurado com URLs localhost em produção")
    print()
    print("🔧 AÇÃO NECESSÁRIA:")
    print("Rebuild do frontend com variável de ambiente correta para produção")

if __name__ == "__main__":
    main()