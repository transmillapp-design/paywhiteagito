"""
Backend Refactoring Tests - Transmill API
Tests for migrated mobility routes, master routes, and auth utilities.
Verifies that endpoints work correctly after migration from server.py to modular routers.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MASTER_EMAIL = "marcelotransmillapp@gmail.com"
MASTER_PASSWORD = "!Ma04202011@"
FRANCHISE_EMAIL = "transmillapp@gmail.com"
FRANCHISE_PASSWORD = "demo123"


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_returns_healthy(self):
        """Health endpoint should return status healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert "version" in data
        print(f"PASS: Health endpoint returns healthy (version: {data.get('version')})")


class TestAuthenticationFlow:
    """Test authentication for master and franchise users"""

    def test_login_master_user(self):
        """Login as master user should return access_token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_EMAIL,
            "password": MASTER_PASSWORD
        })
        assert response.status_code == 200, f"Master login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert len(data["access_token"]) > 0, "access_token is empty"
        print(f"PASS: Master user login successful, token received")
        return data["access_token"]

    def test_login_franchise_user(self):
        """Login as franchise user should return access_token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": FRANCHISE_EMAIL,
            "password": FRANCHISE_PASSWORD
        })
        assert response.status_code == 200, f"Franchise login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        print(f"PASS: Franchise user login successful, token received")
        return data["access_token"]


class TestMobilityRoutes:
    """Test migrated mobility endpoints from mobility_routes.py"""

    @pytest.fixture(autouse=True)
    def get_franchise_token(self):
        """Get franchise user token for mobility tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": FRANCHISE_EMAIL,
            "password": FRANCHISE_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
        else:
            pytest.skip("Could not authenticate franchise user")

    def test_get_driver_profile(self):
        """GET /api/mobility/driver/profile should return profile data"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/mobility/driver/profile", headers=headers)
        assert response.status_code == 200, f"Driver profile failed: {response.text}"
        data = response.json()
        # Response can have exists: true/false based on whether user is registered as driver
        assert "exists" in data or "profile" in data, "Missing expected fields in response"
        print(f"PASS: GET /api/mobility/driver/profile returned successfully")

    def test_get_client_rides(self):
        """GET /api/mobility/client/rides should return rides list"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/mobility/client/rides", headers=headers)
        assert response.status_code == 200, f"Client rides failed: {response.text}"
        data = response.json()
        assert "rides" in data, "Missing 'rides' in response"
        assert isinstance(data["rides"], list), "'rides' should be a list"
        print(f"PASS: GET /api/mobility/client/rides returned {len(data['rides'])} rides")

    def test_get_nearby_drivers(self):
        """GET /api/mobility/drivers/nearby should return drivers list"""
        headers = {"Authorization": f"Bearer {self.token}"}
        params = {"lat": -22.9068, "lng": -43.1729, "radius_km": 50}
        response = requests.get(f"{BASE_URL}/api/mobility/drivers/nearby", headers=headers, params=params)
        assert response.status_code == 200, f"Nearby drivers failed: {response.text}"
        data = response.json()
        assert "drivers" in data, "Missing 'drivers' in response"
        assert isinstance(data["drivers"], list), "'drivers' should be a list"
        print(f"PASS: GET /api/mobility/drivers/nearby returned {len(data['drivers'])} drivers")

    def test_mobility_requires_auth(self):
        """Mobility endpoints should require authentication"""
        response = requests.get(f"{BASE_URL}/api/mobility/driver/profile")
        # Should return 401 or 403 without token
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"PASS: Mobility endpoints correctly require authentication")


class TestMasterRoutes:
    """Test migrated master CRUD endpoints from master.py"""

    @pytest.fixture(autouse=True)
    def setup_tokens(self):
        """Get master and franchise tokens"""
        # Master token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_EMAIL,
            "password": MASTER_PASSWORD
        })
        if response.status_code == 200:
            self.master_token = response.json().get("access_token")
        else:
            pytest.skip("Could not authenticate master user")
        
        # Franchise token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": FRANCHISE_EMAIL,
            "password": FRANCHISE_PASSWORD
        })
        if response.status_code == 200:
            self.franchise_token = response.json().get("access_token")
        else:
            self.franchise_token = None

    def test_get_business_segments_master(self):
        """GET /api/master/business-segments with master token should return success"""
        headers = {"Authorization": f"Bearer {self.master_token}"}
        response = requests.get(f"{BASE_URL}/api/master/business-segments", headers=headers)
        assert response.status_code == 200, f"Business segments failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert "segments" in data, "Missing 'segments' in response"
        print(f"PASS: GET /api/master/business-segments returned {len(data.get('segments', []))} segments")

    def test_get_service_provider_types_master(self):
        """GET /api/master/service-provider-types with master token should return success"""
        headers = {"Authorization": f"Bearer {self.master_token}"}
        response = requests.get(f"{BASE_URL}/api/master/service-provider-types", headers=headers)
        assert response.status_code == 200, f"Service provider types failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert "types" in data, "Missing 'types' in response"
        print(f"PASS: GET /api/master/service-provider-types returned {len(data.get('types', []))} types")

    def test_get_internet_plans_master(self):
        """GET /api/master/internet-plans with master token should return success"""
        headers = {"Authorization": f"Bearer {self.master_token}"}
        response = requests.get(f"{BASE_URL}/api/master/internet-plans", headers=headers)
        assert response.status_code == 200, f"Internet plans failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert "plans" in data, "Missing 'plans' in response"
        print(f"PASS: GET /api/master/internet-plans returned {len(data.get('plans', []))} plans")

    def test_get_telemedicine_plans_master(self):
        """GET /api/master/telemedicine-plans with master token should return success"""
        headers = {"Authorization": f"Bearer {self.master_token}"}
        response = requests.get(f"{BASE_URL}/api/master/telemedicine-plans", headers=headers)
        assert response.status_code == 200, f"Telemedicine plans failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert "plans" in data, "Missing 'plans' in response"
        print(f"PASS: GET /api/master/telemedicine-plans returned {len(data.get('plans', []))} plans")

    def test_master_endpoints_deny_franchise_user(self):
        """GET /api/master/business-segments with franchise (non-master) token should return 403"""
        if not self.franchise_token:
            pytest.skip("Franchise token not available")
        headers = {"Authorization": f"Bearer {self.franchise_token}"}
        response = requests.get(f"{BASE_URL}/api/master/business-segments", headers=headers)
        assert response.status_code == 403, f"Expected 403 for non-master, got {response.status_code}"
        print(f"PASS: Master endpoints correctly deny access to non-master users (403)")


class TestPublicEndpoints:
    """Test public endpoints that don't require authentication"""

    def test_get_active_business_segments_public(self):
        """GET /api/business-segments/active (public, no auth) should return segments list"""
        response = requests.get(f"{BASE_URL}/api/business-segments/active")
        assert response.status_code == 200, f"Public business segments failed: {response.text}"
        data = response.json()
        assert "segments" in data, "Missing 'segments' in response"
        print(f"PASS: GET /api/business-segments/active returned {len(data.get('segments', []))} segments")

    def test_get_public_service_provider_types(self):
        """GET /api/public/service-provider-types (public, no auth) should return types list"""
        response = requests.get(f"{BASE_URL}/api/public/service-provider-types")
        assert response.status_code == 200, f"Public service provider types failed: {response.text}"
        data = response.json()
        # Response structure: {"success": true, "data": {"types": [], "total": 0}}
        assert data.get("success") == True, "Expected success: true"
        assert "data" in data and "types" in data["data"], "Missing 'data.types' in response"
        print(f"PASS: GET /api/public/service-provider-types returned {data['data'].get('total', 0)} types")

    def test_get_internet_plans_requires_auth(self):
        """GET /api/internet-plans requires authentication (not public)"""
        response = requests.get(f"{BASE_URL}/api/internet-plans")
        # This endpoint requires auth - returns 401/403 without token
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"PASS: GET /api/internet-plans correctly requires authentication")

    def test_get_public_telemedicine_plans(self):
        """GET /api/telemedicine-plans (public endpoint, no auth) should return available plans"""
        response = requests.get(f"{BASE_URL}/api/telemedicine-plans")
        assert response.status_code == 200, f"Public telemedicine plans failed: {response.text}"
        data = response.json()
        # Can be a list or object with plans array
        assert isinstance(data, (list, dict)), "Response should be list or dict"
        print(f"PASS: GET /api/telemedicine-plans returned successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
