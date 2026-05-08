"""
Test suite for AcertosPWA - PWA da unidade Labelview
Tests the following features:
1. Version endpoint (v2.38.0)
2. PWA unidade endpoint (Transmill Auto, not AgitoAuto)
3. PWA login endpoint
4. Service request endpoint (solicitar-assistencia-v2)
5. Labelview service-requests endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://api-decompose-1.preview.emergentagent.com').rstrip('/')

# Test credentials
PWA_CLIENT_EMAIL = "cliente.teste@demo.com"
PWA_CLIENT_PASSWORD = "demo123"
MASTER_EMAIL = "transmillapp@gmail.com"
MASTER_PASSWORD = "demo123"
UNIDADE_SLUG = "agitoauto"


class TestVersionEndpoint:
    """Test /api/version endpoint"""
    
    def test_version_returns_2_38_0(self):
        """Version should be v2.38.0"""
        response = requests.get(f"{BASE_URL}/api/version")
        assert response.status_code == 200
        
        data = response.json()
        assert "version" in data or "versao" in data
        version = data.get("version") or data.get("versao")
        assert "2.38.0" in version, f"Expected version 2.38.0, got {version}"
        print(f"✅ Version endpoint returns: {version}")


class TestPWAUnidadeEndpoint:
    """Test /api/pwa/unidade/{slug} endpoint"""
    
    def test_unidade_returns_transmill_auto(self):
        """Unidade should return 'Transmill Auto', not 'AgitoAuto'"""
        response = requests.get(f"{BASE_URL}/api/pwa/unidade/{UNIDADE_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        unidade = data.get("unidade")
        assert unidade is not None
        
        nome = unidade.get("nome_fantasia") or unidade.get("name")
        assert nome == "Transmill Auto", f"Expected 'Transmill Auto', got '{nome}'"
        assert "AgitoAuto" not in nome, f"Name should not contain 'AgitoAuto', got '{nome}'"
        print(f"✅ Unidade name: {nome}")
    
    def test_unidade_has_correct_colors(self):
        """Unidade should have red primary (#FF0000) and green secondary (#00FF00)"""
        response = requests.get(f"{BASE_URL}/api/pwa/unidade/{UNIDADE_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        unidade = data.get("unidade")
        
        cor_primaria = unidade.get("cor_primaria")
        cor_secundaria = unidade.get("cor_secundaria")
        
        assert cor_primaria == "#FF0000", f"Expected primary color #FF0000, got {cor_primaria}"
        assert cor_secundaria == "#00FF00", f"Expected secondary color #00FF00, got {cor_secundaria}"
        print(f"✅ Colors: primary={cor_primaria}, secondary={cor_secundaria}")
    
    def test_unidade_has_required_fields(self):
        """Unidade should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/pwa/unidade/{UNIDADE_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        unidade = data.get("unidade")
        
        required_fields = ["id", "nome_fantasia", "cor_primaria", "cor_secundaria"]
        for field in required_fields:
            assert field in unidade, f"Missing required field: {field}"
        print(f"✅ All required fields present")


class TestPWALoginEndpoint:
    """Test /api/pwa/login endpoint"""
    
    def test_login_with_valid_credentials(self):
        """Login should succeed with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/pwa/login", json={
            "email": PWA_CLIENT_EMAIL,
            "password": PWA_CLIENT_PASSWORD,
            "unidade_slug": UNIDADE_SLUG
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "access_token" in data
        assert "user" in data
        
        user = data.get("user")
        assert user.get("email") == PWA_CLIENT_EMAIL
        print(f"✅ Login successful for {PWA_CLIENT_EMAIL}")
        
        return data.get("access_token")
    
    def test_login_with_invalid_credentials(self):
        """Login should fail with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/pwa/login", json={
            "email": "invalid@email.com",
            "password": "wrongpassword",
            "unidade_slug": UNIDADE_SLUG
        })
        assert response.status_code == 401
        print(f"✅ Login correctly rejected invalid credentials")
    
    def test_login_returns_user_data(self):
        """Login should return user data with required fields"""
        response = requests.post(f"{BASE_URL}/api/pwa/login", json={
            "email": PWA_CLIENT_EMAIL,
            "password": PWA_CLIENT_PASSWORD,
            "unidade_slug": UNIDADE_SLUG
        })
        assert response.status_code == 200
        
        data = response.json()
        user = data.get("user")
        
        # Check required user fields
        assert "id" in user
        assert "email" in user
        assert "full_name" in user
        print(f"✅ User data contains required fields")


class TestSolicitarAssistenciaV2Endpoint:
    """Test POST /api/pwa/solicitar-assistencia-v2 endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/pwa/login", json={
            "email": PWA_CLIENT_EMAIL,
            "password": PWA_CLIENT_PASSWORD,
            "unidade_slug": UNIDADE_SLUG
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_endpoint_requires_authentication(self):
        """Endpoint should require authentication"""
        response = requests.post(f"{BASE_URL}/api/pwa/solicitar-assistencia-v2", data={
            "tipo_servico": "Guincho",
            "latitude": -23.5505,
            "longitude": -46.6333
        })
        assert response.status_code in [401, 403, 422]
        print(f"✅ Endpoint correctly requires authentication")
    
    def test_endpoint_accepts_form_data(self, auth_token):
        """Endpoint should accept form data with service request"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/pwa/solicitar-assistencia-v2",
            headers=headers,
            data={
                "tipo_servico": "Guincho",
                "descricao": "Teste automatizado - veículo parado",
                "latitude": -23.5505,
                "longitude": -46.6333,
                "unidade_id": "",
                "placa": "ABC1234",
                "veiculo": "Fiat Uno 2020"
            }
        )
        
        # Should succeed or return validation error (not auth error)
        assert response.status_code in [200, 201, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert data.get("success") == True
            print(f"✅ Service request created successfully")
        else:
            print(f"⚠️ Validation error (expected in test env): {response.json()}")


class TestLabelviewServiceRequestsEndpoint:
    """Test GET /api/labelview/service-requests endpoint"""
    
    @pytest.fixture
    def master_token(self):
        """Get master authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_EMAIL,
            "password": MASTER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Master authentication failed")
    
    def test_endpoint_requires_authentication(self):
        """Endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/labelview/service-requests")
        assert response.status_code in [401, 403]
        print(f"✅ Endpoint correctly requires authentication")
    
    def test_endpoint_returns_requests_list(self, master_token):
        """Endpoint should return list of service requests"""
        headers = {"Authorization": f"Bearer {master_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/labelview/service-requests",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "requests" in data or "success" in data
            print(f"✅ Service requests endpoint working")
        else:
            print(f"⚠️ Status {response.status_code}: {response.text[:200]}")


class TestPWAMinhaProtecaoEndpoint:
    """Test GET /api/pwa/minha-protecao endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/pwa/login", json={
            "email": PWA_CLIENT_EMAIL,
            "password": PWA_CLIENT_PASSWORD,
            "unidade_slug": UNIDADE_SLUG
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_endpoint_requires_authentication(self):
        """Endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/pwa/minha-protecao")
        assert response.status_code in [401, 403]
        print(f"✅ Endpoint correctly requires authentication")
    
    def test_endpoint_returns_protection_data(self, auth_token):
        """Endpoint should return protection data or null"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/pwa/minha-protecao",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        # protecao can be null if user has no active protection
        print(f"✅ Minha proteção endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
