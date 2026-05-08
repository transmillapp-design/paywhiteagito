#!/usr/bin/env python3
"""
Debug script to check the actual response structure from the filter endpoints
"""

import requests
import json

def debug_endpoints():
    # Read backend URL from frontend .env
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    frontend_url = line.split('=', 1)[1].strip()
                    if frontend_url.endswith('/api'):
                        base_url = frontend_url
                    else:
                        base_url = f"{frontend_url}/api"
                    break
    except:
        base_url = "http://localhost:8001/api"
    
    print(f"🌐 URL Base: {base_url}")
    
    # Login first
    login_data = {
        "email": "teste_unidade@test.com",
        "password": "test123"
    }
    
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if response.status_code == 200:
        token = response.json().get("access_token")
        print("✅ Login successful")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test each endpoint and show actual response
        endpoints = [
            "/labelview/regionais/com-contadores",
            "/labelview/consultores/com-contadores", 
            "/labelview/clientes/hierarquia"
        ]
        
        for endpoint in endpoints:
            print(f"\n=== TESTING {endpoint} ===")
            response = requests.get(f"{base_url}{endpoint}", headers=headers)
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"Response type: {type(data)}")
                    print(f"Response structure:")
                    print(json.dumps(data, indent=2, ensure_ascii=False)[:1000] + "..." if len(str(data)) > 1000 else json.dumps(data, indent=2, ensure_ascii=False))
                except Exception as e:
                    print(f"Error parsing JSON: {e}")
                    print(f"Raw response: {response.text[:500]}")
            else:
                print(f"Error: {response.text}")
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    debug_endpoints()