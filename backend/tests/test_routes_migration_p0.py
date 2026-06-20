"""
P0 Backend Refactor Regression Tests
Verifies 37 endpoints migrated from server.py into 5 new modular routers:
  - routes/fipe.py
  - routes/usdt.py
  - routes/provider_schedule.py
  - routes/orders.py
  - routes/payment_methods.py
Plus regression checks for endpoints that should still work (merchants, prestadores,
health, master dashboard, wallet, mobility).
"""
import os
import pytest
import requests
from pathlib import Path


def _load_backend_url():
    url = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if not url:
        env_path = Path("/app/frontend/.env")
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("REACT_APP_BACKEND_URL="):
                    url = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    return url.rstrip("/")


BASE_URL = _load_backend_url()
assert BASE_URL, "REACT_APP_BACKEND_URL not configured"

MASTER_EMAIL = "marcelotransmillapp@gmail.com"
MASTER_PASSWORD = "!Ma04202011@"
FRANCHISE_EMAIL = "transmillapp@gmail.com"
FRANCHISE_PASSWORD = "demo123"


# --------- Auth helpers ---------
def _login(email, password):
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )
    return r


@pytest.fixture(scope="session")
def master_token():
    r = _login(MASTER_EMAIL, MASTER_PASSWORD)
    assert r.status_code == 200, f"Master login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok, "No access_token in master login response"
    return tok


@pytest.fixture(scope="session")
def client_token():
    r = _login(FRANCHISE_EMAIL, FRANCHISE_PASSWORD)
    assert r.status_code == 200, f"Client login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok, "No access_token in client login response"
    return tok


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# --------- AUTH ---------
class TestAuth:
    def test_master_login(self):
        r = _login(MASTER_EMAIL, MASTER_PASSWORD)
        assert r.status_code == 200, r.text
        assert "access_token" in r.json()

    def test_client_login(self):
        r = _login(FRANCHISE_EMAIL, FRANCHISE_PASSWORD)
        assert r.status_code == 200, r.text
        assert "access_token" in r.json()

    def test_login_invalid(self):
        r = _login("nonexistent_user@example.com", "wrongpw")
        assert r.status_code in (400, 401, 403, 404, 422)


# --------- MIGRATED: fipe.py ---------
class TestFipeRoutes:
    def test_marcas_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/brasil-api/fipe/marcas/carros", timeout=30)
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_marcas_with_auth(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/brasil-api/fipe/marcas/carros",
            headers=H(client_token),
            timeout=60,
        )
        # Endpoint should respond 200 even if external FIPE is unavailable (success:false)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"
        data = r.json()
        assert "success" in data, "Response should contain 'success' field"

    def test_modelos_endpoint_exists(self, client_token):
        # Use a dummy marca; endpoint just needs to respond (not 404)
        r = requests.get(
            f"{BASE_URL}/api/brasil-api/fipe/modelos/carros/1",
            headers=H(client_token),
            timeout=60,
        )
        assert r.status_code != 404, f"Endpoint missing (404). body={r.text[:200]}"
        assert r.status_code in (200, 400, 422, 500, 502, 503), r.status_code

    def test_anos_endpoint_exists(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/brasil-api/fipe/anos/carros/1/1",
            headers=H(client_token),
            timeout=60,
        )
        assert r.status_code != 404, f"anos endpoint missing. body={r.text[:200]}"

    def test_valor_endpoint_exists(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/brasil-api/fipe/valor/carros/1/1/2024",
            headers=H(client_token),
            timeout=60,
        )
        assert r.status_code != 404, f"valor endpoint missing. body={r.text[:200]}"


# --------- MIGRATED: usdt.py ---------
class TestUsdtRoutes:
    def test_usdt_rate(self, client_token):
        r = requests.get(f"{BASE_URL}/api/usdt/rate", headers=H(client_token), timeout=30)
        assert r.status_code == 200, f"usdt/rate failed: {r.status_code} {r.text[:200]}"
        data = r.json()
        assert data.get("success") is True, f"Expected success:true, got {data}"
        # USDTService returns {"success": True, "data": 5.85, "error": None}
        raw = data.get("data")
        if isinstance(raw, dict):
            rate = raw.get("rate") or raw.get("usdt_rate")
        else:
            rate = raw if isinstance(raw, (int, float)) else data.get("rate")
        assert isinstance(rate, (int, float)), f"rate must be numeric, got {rate} (type {type(rate)})"
        assert rate > 0, f"rate must be positive, got {rate}"
        # Guard against mock-shadow: 5.45 was an old stub value
        assert abs(rate - 5.45) > 1e-6, f"rate is the mock value 5.45 — duplicate-route shadowing!"

    def test_calculate_fee(self, client_token):
        r = requests.post(
            f"{BASE_URL}/api/usdt/calculate-fee",
            headers=H(client_token),
            json={"amount_brl": 100},
            timeout=30,
        )
        assert r.status_code == 200, f"calculate-fee failed: {r.status_code} {r.text[:200]}"
        data = r.json()
        assert data.get("success") is True or "fee" in str(data).lower(), f"Unexpected: {data}"

    def test_pending_approvals_master(self, master_token):
        r = requests.get(
            f"{BASE_URL}/api/master/usdt/pending-approvals",
            headers=H(master_token),
            timeout=30,
        )
        assert r.status_code == 200, f"pending-approvals master failed: {r.status_code} {r.text[:200]}"
        data = r.json()
        assert data.get("success") is True, f"Expected success:true, got {data}"

    def test_pending_approvals_denies_non_master(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/master/usdt/pending-approvals",
            headers=H(client_token),
            timeout=30,
        )
        assert r.status_code == 403, f"Expected 403 for non-master, got {r.status_code}: {r.text[:200]}"


# --------- MIGRATED: provider_schedule.py ---------
class TestProviderSchedule:
    def test_provider_availability_client_gets_authz_msg(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/provider/availability",
            headers=H(client_token),
            timeout=30,
        )
        # Must NOT be 404/500; either 200 with success:false or 403 is acceptable
        assert r.status_code not in (404, 500), f"Endpoint broken: {r.status_code} {r.text[:200]}"
        assert r.status_code in (200, 401, 403), r.status_code

    def test_provider_slots_endpoint_exists(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/provider/some-provider-id/available-slots",
            headers=H(client_token),
            timeout=30,
        )
        # 404 with "Prestador não encontrado" means route exists but provider ID unknown — that's OK
        if r.status_code == 404:
            assert "encontrado" in r.text.lower() or "not found" not in r.text.lower(), (
                f"Generic 404 (route missing): {r.text[:200]}"
            )
        else:
            assert r.status_code in (200, 400, 401, 403, 422), r.status_code

    def test_appointments_my(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/appointments/my",
            headers=H(client_token),
            timeout=30,
        )
        assert r.status_code not in (404, 500), f"appointments/my broken: {r.status_code} {r.text[:200]}"


# --------- MIGRATED: orders.py ---------
class TestOrdersRoutes:
    def test_my_orders(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/orders/my-orders",
            headers=H(client_token),
            timeout=30,
        )
        assert r.status_code == 200, f"my-orders failed: {r.status_code} {r.text[:200]}"
        data = r.json()
        assert data.get("success") is True, f"Expected success:true, got {data}"

    def test_catalog_endpoint_responds(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/catalog/some-merchant-id",
            headers=H(client_token),
            timeout=30,
        )
        # 404 with "Lojista não encontrado" means route exists but merchant unknown — OK
        if r.status_code == 404:
            assert "lojista" in r.text.lower() or "encontrado" in r.text.lower(), (
                f"Generic 404 (route missing): {r.text[:200]}"
            )
        else:
            assert r.status_code in (200, 400, 401, 403, 422), r.status_code

    def test_merchant_orders_list(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/orders/merchant/list",
            headers=H(client_token),
            timeout=30,
        )
        # Endpoint must exist; auth/role decisions handled internally
        assert r.status_code not in (404, 500), f"merchant orders list broken: {r.status_code} {r.text[:200]}"

    def test_my_orders_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/orders/my-orders", timeout=30)
        assert r.status_code in (401, 403)


# --------- MIGRATED: payment_methods.py ---------
class TestPaymentMethods:
    def test_get_user_payment_methods(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/user/payment-methods",
            headers=H(client_token),
            timeout=30,
        )
        assert r.status_code == 200, f"GET payment-methods failed: {r.status_code} {r.text[:200]}"
        data = r.json()
        assert data.get("success") is True, f"Expected success:true, got {data}"

    def test_patch_user_payment_methods(self, client_token):
        # PATCH may 403 for clients (only lojista/service_provider) — expected, not a bug
        r = requests.patch(
            f"{BASE_URL}/api/user/payment-methods",
            headers=H(client_token),
            json={"accepts_pix": True, "accepts_credit_card": True},
            timeout=30,
        )
        assert r.status_code in (200, 403), f"PATCH unexpected: {r.status_code} {r.text[:200]}"

    def test_get_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/user/payment-methods", timeout=30)
        assert r.status_code in (401, 403)


# --------- REGRESSION (NOT migrated) ---------
class TestRegression:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"

    def test_merchants(self, client_token):
        r = requests.get(f"{BASE_URL}/api/merchants", headers=H(client_token), timeout=30)
        assert r.status_code == 200, f"/api/merchants broken: {r.status_code} {r.text[:200]}"

    def test_prestadores(self, client_token):
        r = requests.get(f"{BASE_URL}/api/prestadores", headers=H(client_token), timeout=30)
        assert r.status_code == 200, f"/api/prestadores broken: {r.status_code} {r.text[:200]}"

    def test_master_dashboard(self, master_token):
        r = requests.get(f"{BASE_URL}/api/master/dashboard", headers=H(master_token), timeout=30)
        assert r.status_code == 200, f"master/dashboard broken: {r.status_code} {r.text[:200]}"

    def test_master_total_balance(self, master_token):
        # Wallet/transactions endpoints live under /api/master/* and /api/xgate/*
        r = requests.get(f"{BASE_URL}/api/master/total-balance", headers=H(master_token), timeout=30)
        assert r.status_code == 200, f"master/total-balance broken: {r.status_code} {r.text[:200]}"

    def test_master_all_transactions(self, master_token):
        r = requests.get(f"{BASE_URL}/api/master/all-transactions", headers=H(master_token), timeout=30)
        assert r.status_code == 200, f"master/all-transactions broken: {r.status_code} {r.text[:200]}"

    def test_mobility_driver_profile(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/mobility/driver/profile",
            headers=H(client_token),
            timeout=30,
        )
        assert r.status_code == 200, f"mobility/driver/profile broken: {r.status_code} {r.text[:200]}"

    def test_mobility_client_rides(self, client_token):
        r = requests.get(
            f"{BASE_URL}/api/mobility/client/rides",
            headers=H(client_token),
            timeout=30,
        )
        assert r.status_code == 200, f"mobility/client/rides broken: {r.status_code} {r.text[:200]}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
