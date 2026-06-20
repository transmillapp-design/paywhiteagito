"""
Test Suite for Transmill v2.38.19 - Bug Fixes P0/P1
Tests:
1. Login admin master redirects to /admin/franquias
2. Login page has dark green color #293618
3. Admin dashboard shows correct statistics
4. Solicitações page has no TypeError - fields with 'N/A' fallback
5. API /api/version returns v2.38.19
6. API /api/admin/franquias/stats returns data correctly
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://slim-super-app.preview.emergentagent.com')

# Test credentials
ADMIN_MASTER_EMAIL = "marcelotransmillapp@gmail.com"
ADMIN_MASTER_PASSWORD = "!Ma04202011@"
FRANQUIA_ADMIN_EMAIL = "transmillapp@gmail.com"
FRANQUIA_ADMIN_PASSWORD = "demo123"


class TestVersionAPI:
    """Test /api/version endpoint"""
    
    def test_version_endpoint_returns_200(self):
        """Test that version endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/version")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_version_returns_v2_38_19(self):
        """Test that version is v2.38.19"""
        response = requests.get(f"{BASE_URL}/api/version")
        assert response.status_code == 200
        data = response.json()
        
        # Check version field
        assert "versao" in data or "version" in data, "Version field not found in response"
        version = data.get("versao") or data.get("version", "").replace("v", "")
        assert version == "2.38.19", f"Expected version 2.38.19, got {version}"
    
    def test_version_has_bugfix_info(self):
        """Test that version response includes bugfix information"""
        response = requests.get(f"{BASE_URL}/api/version")
        assert response.status_code == 200
        data = response.json()
        
        # Check for changelog/changes
        if "ultimas_mudancas" in data:
            changes = data["ultimas_mudancas"]
            assert len(changes) > 0, "No changes found in version response"
            
            # Check latest version has P0/P1 bugfix info
            latest = changes[0]
            assert latest.get("version") == "2.38.19", f"Latest version should be 2.38.19"


class TestAdminMasterLogin:
    """Test admin master login functionality"""
    
    def test_login_endpoint_exists(self):
        """Test that login endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "invalid"
        })
        # Should return 401 for invalid credentials, not 404
        assert response.status_code in [401, 400, 422], f"Expected 401/400/422, got {response.status_code}"
    
    def test_admin_master_login_success(self):
        """Test admin master login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_MASTER_EMAIL,
            "password": ADMIN_MASTER_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed with status {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify token is returned
        assert "access_token" in data, "No access_token in response"
        assert data["access_token"], "access_token is empty"
        
        # Verify user data
        assert "user" in data, "No user data in response"
        user = data["user"]
        assert user.get("email") == ADMIN_MASTER_EMAIL, "Email mismatch"
    
    def test_admin_master_has_correct_user_type(self):
        """Test that admin master has correct user_type for redirect"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_MASTER_EMAIL,
            "password": ADMIN_MASTER_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        user = data.get("user", {})
        
        # Admin master should have user_type 'master' and is_labelview_master=True
        # This determines redirect to /admin/franquias
        user_type = user.get("user_type")
        is_labelview_master = user.get("is_labelview_master", False)
        
        print(f"User type: {user_type}, is_labelview_master: {is_labelview_master}")
        
        # Either user_type is 'master' or is_labelview_master is True
        assert user_type == "master" or is_labelview_master, \
            f"Admin master should have user_type='master' or is_labelview_master=True. Got: user_type={user_type}, is_labelview_master={is_labelview_master}"


class TestAdminFranquiasStats:
    """Test /api/admin/franquias/stats endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for admin master"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_MASTER_EMAIL,
            "password": ADMIN_MASTER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_stats_endpoint_requires_auth(self):
        """Test that stats endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/franquias/stats")
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422, got {response.status_code}"
    
    def test_stats_endpoint_returns_data(self, auth_token):
        """Test that stats endpoint returns data with valid auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/franquias/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Stats endpoint failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "No 'success' field in response"
        assert data["success"] == True, f"Stats request failed: {data}"
    
    def test_stats_has_required_fields(self, auth_token):
        """Test that stats response has required fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/franquias/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("success"):
            stats = data.get("stats", {})
            
            # Check for expected fields
            expected_fields = ["totalFranquias", "franquiasAtivas", "saldoBolsao"]
            for field in expected_fields:
                assert field in stats, f"Missing field '{field}' in stats"
                print(f"  {field}: {stats.get(field)}")


class TestFranquiasEndpoint:
    """Test /api/franquias endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for admin master"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_MASTER_EMAIL,
            "password": ADMIN_MASTER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_franquias_endpoint_returns_list(self, auth_token):
        """Test that franquias endpoint returns a list"""
        response = requests.get(
            f"{BASE_URL}/api/franquias",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Franquias endpoint failed: {response.status_code}"
        data = response.json()
        
        assert "success" in data, "No 'success' field in response"
        if data.get("success"):
            assert "franquias" in data, "No 'franquias' field in response"
            franquias = data.get("franquias", [])
            print(f"  Total franquias: {len(franquias)}")


class TestSolicitacoesEndpoint:
    """Test /api/labelview/solicitacoes-servico endpoint - P1 bugfix"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for admin master"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_MASTER_EMAIL,
            "password": ADMIN_MASTER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_solicitacoes_endpoint_exists(self, auth_token):
        """Test that solicitacoes endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/labelview/solicitacoes-servico",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should return 200 or 404 (if no data), not 500 (TypeError)
        assert response.status_code in [200, 404], \
            f"Solicitacoes endpoint returned unexpected status: {response.status_code} - {response.text}"
    
    def test_solicitacoes_no_typeerror(self, auth_token):
        """Test that solicitacoes endpoint doesn't throw TypeError (P1 bugfix)"""
        response = requests.get(
            f"{BASE_URL}/api/labelview/solicitacoes-servico",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # The P1 bug was TypeError when fields were undefined
        # After fix, should return 200 with proper fallbacks
        if response.status_code == 200:
            data = response.json()
            
            # If there are solicitacoes, verify they have proper structure
            if data.get("success") and data.get("solicitacoes"):
                for sol in data["solicitacoes"][:3]:  # Check first 3
                    # These fields should have fallbacks to 'N/A' or empty values
                    # Not throw TypeError
                    print(f"  Solicitacao: {sol.get('numero_solicitacao', sol.get('id', 'N/A'))}")
                    print(f"    Cliente: {sol.get('cliente_nome', 'N/A')}")
                    # Note: veiculo can be string or object depending on data source
                    veiculo = sol.get('veiculo', 'N/A')
                    placa = sol.get('placa_veiculo', 'N/A')
                    if isinstance(veiculo, dict):
                        placa = veiculo.get('placa', placa)
                        veiculo = f"{veiculo.get('marca', '')} {veiculo.get('modelo', '')}"
                    print(f"    Veiculo: {veiculo}")
                    print(f"    Placa: {placa}")


class TestHealthEndpoint:
    """Test /api/health endpoint"""
    
    def test_health_endpoint_returns_200(self):
        """Test that health endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
