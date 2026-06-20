"""
Tests for the per-franchise integration credentials feature (XGate, Google Maps,
Cloudinary, BaaS) + regression checks (FIPE removed, core endpoints).
"""
import os
import pytest
import requests
from pathlib import Path

# Load REACT_APP_BACKEND_URL from frontend .env (no default; fail fast).
def _load_base_url() -> str:
    env_path = Path('/app/frontend/.env')
    for line in env_path.read_text().splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            return line.split('=', 1)[1].strip().rstrip('/')
    raise RuntimeError("REACT_APP_BACKEND_URL not found in /app/frontend/.env")

BASE = _load_base_url()
MASTER = ("marcelotransmillapp@gmail.com", "!Ma04202011@")
FRANQ = ("transmillapp@gmail.com", "demo123")
SLUG = "transmill"
OTHER_SLUG = "transmill-sp"


def _login(email, password):
    r = requests.post(f"{BASE}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def master_token():
    return _login(*MASTER)


@pytest.fixture(scope="module")
def franq_token():
    return _login(*FRANQ)


# ---------------- Integrations: authorization ----------------
class TestIntegracoesAuth:
    def test_franqueado_can_read_own_slug(self, franq_token):
        r = requests.get(f"{BASE}/api/franquias/{SLUG}/integracoes",
                         headers={"Authorization": f"Bearer {franq_token}"}, timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert body.get("success") is True
        assert set(body["integracoes"].keys()) >= {"xgate", "google_maps", "cloudinary", "baas"}

    def test_franqueado_blocked_on_other_slug(self, franq_token):
        r = requests.get(f"{BASE}/api/franquias/{OTHER_SLUG}/integracoes",
                         headers={"Authorization": f"Bearer {franq_token}"}, timeout=30)
        assert r.status_code == 403

    def test_master_can_read_any_slug(self, master_token):
        for s in (SLUG, OTHER_SLUG):
            r = requests.get(f"{BASE}/api/franquias/{s}/integracoes",
                             headers={"Authorization": f"Bearer {master_token}"}, timeout=30)
            assert r.status_code == 200, f"master read {s}: {r.status_code} {r.text}"

    def test_no_auth_blocked(self):
        r = requests.get(f"{BASE}/api/franquias/{SLUG}/integracoes", timeout=30)
        assert r.status_code in (401, 403)


# ---------------- Integrations: PUT + masking ----------------
class TestIntegracoesSaveAndMask:
    def test_put_then_get_masked(self, franq_token):
        h = {"Authorization": f"Bearer {franq_token}"}
        payload = {
            "xgate": {"email": "a@b.com", "password": "pwd123456", "api_url": "https://api.xgateglobal.com"},
            "google_maps": {"api_key": "AIzaTESTKEY1234"},
            "cloudinary": {"cloud_name": "cn", "api_key": "ck12345", "api_secret": "cs67890"},
            "baas": {"provider_name": "Asaas", "api_key": "baas987654"},
        }
        r = requests.put(f"{BASE}/api/franquias/{SLUG}/integracoes", json=payload, headers=h, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

        # GET back masked
        r2 = requests.get(f"{BASE}/api/franquias/{SLUG}/integracoes", headers=h, timeout=30)
        assert r2.status_code == 200
        integ = r2.json()["integracoes"]

        # Non-secret fields clear
        assert integ["xgate"]["email"] == "a@b.com"
        assert integ["xgate"]["api_url"] == "https://api.xgateglobal.com"
        assert integ["cloudinary"]["cloud_name"] == "cn"
        assert integ["baas"]["provider_name"] == "Asaas"

        # Secret fields masked + configured
        assert integ["xgate"]["password"]["configured"] is True
        assert integ["xgate"]["password"]["masked"].endswith("3456")
        assert integ["google_maps"]["api_key"]["configured"] is True
        assert integ["google_maps"]["api_key"]["masked"].endswith("1234")
        assert integ["cloudinary"]["api_key"]["configured"] is True
        assert integ["cloudinary"]["api_key"]["masked"].endswith("2345")
        assert integ["cloudinary"]["api_secret"]["configured"] is True
        assert integ["cloudinary"]["api_secret"]["masked"].endswith("7890")
        assert integ["baas"]["api_key"]["configured"] is True
        assert integ["baas"]["api_key"]["masked"].endswith("7654")

    def test_partial_update_preserves_other_secrets(self, franq_token):
        h = {"Authorization": f"Bearer {franq_token}"}
        # Only update baas.provider_name
        r = requests.put(f"{BASE}/api/franquias/{SLUG}/integracoes",
                         json={"baas": {"provider_name": "Dock"}}, headers=h, timeout=30)
        assert r.status_code == 200

        r2 = requests.get(f"{BASE}/api/franquias/{SLUG}/integracoes", headers=h, timeout=30)
        integ = r2.json()["integracoes"]
        assert integ["baas"]["provider_name"] == "Dock"
        # Previously saved secrets MUST still be configured
        assert integ["xgate"]["password"]["configured"] is True
        assert integ["cloudinary"]["api_key"]["configured"] is True
        assert integ["cloudinary"]["api_secret"]["configured"] is True
        assert integ["google_maps"]["api_key"]["configured"] is True
        # baas.api_key was NOT re-sent → should still be configured
        assert integ["baas"]["api_key"]["configured"] is True


# ---------------- Public maps-config (no auth) ----------------
class TestPublicMapsConfig:
    def test_public_maps_config_returns_key(self):
        r = requests.get(f"{BASE}/api/public/franquias/{SLUG}/maps-config", timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert body.get("success") is True
        # We just saved AIzaTESTKEY1234 → must be returned in clear
        assert body.get("google_maps_key") == "AIzaTESTKEY1234"

    def test_public_maps_config_unknown_slug_returns_null(self):
        r = requests.get(f"{BASE}/api/public/franquias/__no_such_slug__/maps-config", timeout=30)
        assert r.status_code == 200
        assert r.json().get("google_maps_key") in (None, "")


# ---------------- FIPE removed ----------------
class TestFipeRemoved:
    def test_fipe_marcas_removed(self):
        r = requests.get(f"{BASE}/api/brasil-api/fipe/marcas/carros", timeout=30)
        assert r.status_code == 404, f"expected 404, got {r.status_code} body={r.text[:200]}"


# ---------------- Core regression ----------------
class TestRegression:
    def test_health(self):
        r = requests.get(f"{BASE}/api/health", timeout=30)
        assert r.status_code == 200

    def test_login_master(self):
        token = _login(*MASTER)
        assert token

    def test_usdt_rate(self, franq_token):
        r = requests.get(f"{BASE}/api/usdt/rate",
                         headers={"Authorization": f"Bearer {franq_token}"}, timeout=30)
        assert r.status_code == 200
        body = r.json()
        # accept various shapes: {data: x}, {rate: x}, {buy_rate, sell_rate}
        assert body.get("success") is True or any(
            k in body for k in ("rate", "buy_rate", "sell_rate", "usdt_brl", "price", "data")
        )
        assert any(k in body for k in ("rate", "buy_rate", "sell_rate", "usdt_brl", "price", "data"))

    def test_orders_my_orders(self, franq_token):
        r = requests.get(f"{BASE}/api/orders/my-orders",
                         headers={"Authorization": f"Bearer {franq_token}"}, timeout=30)
        assert r.status_code == 200

    def test_user_payment_methods(self, franq_token):
        r = requests.get(f"{BASE}/api/user/payment-methods",
                         headers={"Authorization": f"Bearer {franq_token}"}, timeout=30)
        assert r.status_code in (200, 204)

    def test_master_all_transactions(self, master_token):
        r = requests.get(f"{BASE}/api/master/all-transactions",
                         headers={"Authorization": f"Bearer {master_token}"}, timeout=60)
        assert r.status_code == 200, f"all-transactions failed: {r.status_code} {r.text[:300]}"
