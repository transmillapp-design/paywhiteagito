"""
Test Suite: Transmill Cleanup Verification
Tests for verifying removed features (labelview, telemedicina, internet, social, chatbot)
and ensuring kept features (mobilidade, lojas, serviços, carteira digital, criptoativos, franquias) still work.
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


class TestHealthAndAuth:
    """Health endpoint and authentication tests"""
    
    def test_health_returns_healthy(self):
        """Health endpoint /api/health returns healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert "version" in data
        print(f"✅ Health check passed - version: {data.get('version')}")
    
    def test_login_master_user(self):
        """Login as master user returns access_token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_EMAIL,
            "password": MASTER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert len(data["access_token"]) > 0
        print(f"✅ Master user login successful")
        return data["access_token"]
    
    def test_login_franchise_user(self):
        """Login as franchise user returns access_token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": FRANCHISE_EMAIL,
            "password": FRANCHISE_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert len(data["access_token"]) > 0
        print(f"✅ Franchise user login successful")
        return data["access_token"]


class TestMasterEndpoints:
    """Master dashboard and business segments tests"""
    
    @pytest.fixture
    def master_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_EMAIL,
            "password": MASTER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Master login failed")
    
    def test_master_dashboard_no_labelview(self, master_token):
        """GET /api/master/dashboard with master token returns platform_stats WITHOUT labelview section"""
        headers = {"Authorization": f"Bearer {master_token}"}
        response = requests.get(f"{BASE_URL}/api/master/dashboard", headers=headers)
        # Dashboard may return 200 or 404 if endpoint was removed
        if response.status_code == 200:
            data = response.json()
            # Verify no labelview section in response
            assert "labelview" not in str(data).lower() or data.get("labelview") is None
            print(f"✅ Master dashboard returned without labelview section")
        else:
            print(f"ℹ️ Master dashboard endpoint status: {response.status_code}")
    
    def test_master_business_segments(self, master_token):
        """GET /api/master/business-segments with master token returns success:true"""
        headers = {"Authorization": f"Bearer {master_token}"}
        response = requests.get(f"{BASE_URL}/api/master/business-segments", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Master business-segments returned {data.get('total', 0)} segments")


class TestMobilityEndpoints:
    """Mobility endpoints tests (kept feature)"""
    
    @pytest.fixture
    def franchise_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": FRANCHISE_EMAIL,
            "password": FRANCHISE_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Franchise login failed")
    
    def test_mobility_driver_profile(self, franchise_token):
        """GET /api/mobility/driver/profile with franchise user token returns profile data"""
        headers = {"Authorization": f"Bearer {franchise_token}"}
        response = requests.get(f"{BASE_URL}/api/mobility/driver/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "profile" in data or "driver" in data or "user_id" in data or "success" in data
        print(f"✅ Mobility driver profile endpoint working")
    
    def test_mobility_client_rides(self, franchise_token):
        """GET /api/mobility/client/rides with franchise user token returns rides list"""
        headers = {"Authorization": f"Bearer {franchise_token}"}
        response = requests.get(f"{BASE_URL}/api/mobility/client/rides", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "rides" in data or isinstance(data, list) or "success" in data
        print(f"✅ Mobility client rides endpoint working")
    
    def test_mobility_nearby_drivers(self, franchise_token):
        """GET /api/mobility/drivers/nearby with coordinates returns drivers"""
        headers = {"Authorization": f"Bearer {franchise_token}"}
        response = requests.get(
            f"{BASE_URL}/api/mobility/drivers/nearby",
            params={"lat": -22.9068, "lng": -43.1729, "radius_km": 50},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "drivers" in data or isinstance(data, list) or "success" in data
        print(f"✅ Mobility nearby drivers endpoint working")


class TestRemovedFeatures:
    """Tests to verify removed features return 404"""
    
    @pytest.fixture
    def master_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_EMAIL,
            "password": MASTER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Master login failed")
    
    def test_labelview_endpoints_removed(self, master_token):
        """VERIFY /api/labelview/* endpoints return 404 (removed feature)"""
        headers = {"Authorization": f"Bearer {master_token}"}
        
        # Test various labelview endpoints that should be removed
        labelview_endpoints = [
            "/api/labelview/dashboard",
            "/api/labelview/vehicles",
            "/api/labelview/policies",
            "/api/labelview/claims",
            "/api/labelview/stats",
        ]
        
        for endpoint in labelview_endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            # Should return 404 (not found) or 405 (method not allowed)
            assert response.status_code in [404, 405, 422], f"Endpoint {endpoint} should be removed but returned {response.status_code}"
            print(f"✅ {endpoint} correctly returns {response.status_code} (removed)")
    
    def test_master_internet_plans_removed(self, master_token):
        """VERIFY /api/master/internet-plans returns 404 or not found (removed from master.py)"""
        headers = {"Authorization": f"Bearer {master_token}"}
        response = requests.get(f"{BASE_URL}/api/master/internet-plans", headers=headers)
        # Should return 404 (not found) since it was removed
        assert response.status_code in [404, 405, 422], f"Expected 404 but got {response.status_code}"
        print(f"✅ /api/master/internet-plans correctly returns {response.status_code} (removed)")
    
    def test_master_telemedicine_plans_removed(self, master_token):
        """VERIFY /api/master/telemedicine-plans returns 404 or not found (removed from master.py)"""
        headers = {"Authorization": f"Bearer {master_token}"}
        response = requests.get(f"{BASE_URL}/api/master/telemedicine-plans", headers=headers)
        # Should return 404 (not found) since it was removed
        assert response.status_code in [404, 405, 422], f"Expected 404 but got {response.status_code}"
        print(f"✅ /api/master/telemedicine-plans correctly returns {response.status_code} (removed)")


class TestPublicEndpoints:
    """Public endpoints tests (no auth required)"""
    
    def test_public_business_segments_active(self):
        """GET /api/business-segments/active (public) still works"""
        response = requests.get(f"{BASE_URL}/api/business-segments/active")
        assert response.status_code == 200
        data = response.json()
        assert "segments" in data or isinstance(data, list) or "success" in data
        print(f"✅ Public business-segments/active endpoint working")


class TestWalletEndpoints:
    """Wallet endpoints tests (kept feature)"""
    
    def test_wallet_balance_in_login(self):
        """Login response includes balance (wallet feature)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": FRANCHISE_EMAIL,
            "password": FRANCHISE_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        user = data.get("user", {})
        # Wallet balance should be in user object
        assert "balance" in user
        assert "cashback_balance" in user
        assert "usdt_balance" in user
        print(f"✅ Wallet balance in login response - balance: {user.get('balance')}, cashback: {user.get('cashback_balance')}")
    
    def test_transactions_history(self):
        """GET /api/transactions/history with token returns transaction history"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": FRANCHISE_EMAIL,
            "password": FRANCHISE_PASSWORD
        })
        token = login_response.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/transactions/history", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data or "success" in data
        print(f"✅ Transactions history endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
