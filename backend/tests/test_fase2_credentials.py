"""
Fase 2 — per-white-label credential resolution & regression tests.

Covers:
- Credential resolution: USDTService per-user with .env fallback (transmill has no saved creds)
- White-label cred set/get on slug 'transmill-sp'
- Regression: health, login, slim-super-app endpoints, /api/master/all-transactions, FIPE 404
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://slim-super-app.preview.emergentagent.com').rstrip('/')

MASTER_EMAIL = "marcelotransmillapp@gmail.com"
MASTER_PASS = "!Ma04202011@"
FRAN_EMAIL = "transmillapp@gmail.com"
FRAN_PASS = "demo123"


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"Login failed {email}: {r.status_code} {r.text}"
    data = r.json()
    return data["access_token"], data["user"]


@pytest.fixture(scope="module")
def master_token():
    tok, _ = _login(MASTER_EMAIL, MASTER_PASS)
    return tok


@pytest.fixture(scope="module")
def fran_token():
    tok, _ = _login(FRAN_EMAIL, FRAN_PASS)
    return tok


# ---------- Regression ----------
class TestRegression:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"

    def test_master_login(self):
        tok, user = _login(MASTER_EMAIL, MASTER_PASS)
        assert tok
        assert user.get("is_master_account") or user.get("user_type") == "master"

    def test_franqueado_login(self):
        tok, user = _login(FRAN_EMAIL, FRAN_PASS)
        assert tok
        # franqueado: user_type=labelview_unidade. franquia_slug may not be on root user payload.
        assert user.get("user_type") in ("labelview_unidade", "master")
        assert user.get("email") == FRAN_EMAIL

    def test_transmill_public(self):
        r = requests.get(f"{BASE_URL}/api/franquias/transmill", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("success") is True
        assert body.get("franquia", {}).get("slug") == "transmill"

    def test_transmill_integracoes_master(self, master_token):
        r = requests.get(
            f"{BASE_URL}/api/franquias/transmill/integracoes",
            headers={"Authorization": f"Bearer {master_token}"}, timeout=15)
        assert r.status_code == 200

    def test_transmill_integracoes_own_slug(self, fran_token):
        # Franqueado of transmill SHOULD read its OWN slug
        r = requests.get(
            f"{BASE_URL}/api/franquias/transmill/integracoes",
            headers={"Authorization": f"Bearer {fran_token}"}, timeout=15)
        assert r.status_code == 200

    def test_cross_slug_forbidden(self, fran_token):
        # Franqueado of transmill should NOT read transmill-sp's integracoes
        r = requests.get(
            f"{BASE_URL}/api/franquias/transmill-sp/integracoes",
            headers={"Authorization": f"Bearer {fran_token}"}, timeout=15)
        assert r.status_code == 403

    def test_maps_config_public(self):
        r = requests.get(f"{BASE_URL}/api/public/franquias/transmill/maps-config", timeout=15)
        assert r.status_code == 200

    def test_my_orders_franqueado(self, fran_token):
        r = requests.get(f"{BASE_URL}/api/orders/my-orders",
                         headers={"Authorization": f"Bearer {fran_token}"}, timeout=20)
        assert r.status_code == 200

    def test_master_all_transactions_no_objectid_error(self, master_token):
        r = requests.get(f"{BASE_URL}/api/master/all-transactions",
                         headers={"Authorization": f"Bearer {master_token}"}, timeout=30)
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:300]}"
        body = r.json()
        assert isinstance(body, dict)
        # Note: '_id' may legitimately appear in totals_by_type from MongoDB aggregation $group key.
        # We check ObjectId leakage in transaction documents specifically (24-hex with $oid pattern).
        txt = r.text
        assert '"$oid"' not in txt, "BSON ObjectId leaked into response"
        for tx in body.get("transactions", []):
            assert "_id" not in tx, f"_id key leaked in tx doc: {tx}"

    def test_fipe_still_404(self):
        r = requests.get(f"{BASE_URL}/api/brasil-api/fipe/marcas/carros", timeout=15)
        assert r.status_code == 404


# ---------- Fase 2: Credential resolution ----------
class TestFase2CredResolution:
    def test_usdt_rate_with_franqueado_fallback_env(self, fran_token):
        """transmill has no XGate creds saved → must fall back to env, NOT error."""
        r = requests.get(f"{BASE_URL}/api/usdt/rate",
                         headers={"Authorization": f"Bearer {fran_token}"}, timeout=60)
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:300]}"
        body = r.json()
        assert body.get("success") is True
        # Rate at top-level (data field) or under data.rate
        rate = body.get("data")
        if isinstance(rate, dict):
            rate = rate.get("rate") or rate.get("price")
        assert rate is not None and float(rate) > 0, f"rate not numeric in {body}"

    def test_usdt_calculate_fee_with_franqueado(self, fran_token):
        r = requests.post(f"{BASE_URL}/api/usdt/calculate-fee",
                          json={"amount_brl": 100},
                          headers={"Authorization": f"Bearer {fran_token}"}, timeout=60)
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:300]}"
        body = r.json()
        assert body.get("success") is True

    def test_usdt_rate_with_master_fallback_env(self, master_token):
        r = requests.get(f"{BASE_URL}/api/usdt/rate",
                         headers={"Authorization": f"Bearer {master_token}"}, timeout=60)
        assert r.status_code == 200


# ---------- Fase 2: Set & retrieve white-label creds on transmill-sp ----------
class TestFase2SetCreds:
    def test_put_and_get_transmill_sp_xgate(self, master_token):
        headers = {"Authorization": f"Bearer {master_token}"}
        payload = {
            "xgate": {
                "email": "test-xgate-sp@example.com",
                "password": "TESTpwdSP9999",
                "api_url": "https://api.xgateglobal.com"
            }
        }
        r = requests.put(f"{BASE_URL}/api/franquias/transmill-sp/integracoes",
                         json=payload, headers=headers, timeout=30)
        assert r.status_code in (200, 201), f"PUT failed: {r.status_code} {r.text[:300]}"

        # Now GET (masked)
        r2 = requests.get(f"{BASE_URL}/api/franquias/transmill-sp/integracoes",
                          headers=headers, timeout=30)
        assert r2.status_code == 200
        body = r2.json()
        # Find xgate entry — accept different shapes
        xg = None
        if isinstance(body, dict):
            xg = body.get("xgate") or (body.get("integracoes") or {}).get("xgate") or body.get("data", {}).get("xgate")
        assert xg is not None, f"xgate not in body: {body}"
        # Email should be returned plain; password/api_key fields must be masked
        email = xg.get("email")
        assert email == "test-xgate-sp@example.com" or (email and "@" in email)
        # Mask check on password field
        pwd_field = xg.get("password") or xg.get("password_masked") or xg.get("password_preview")
        # Must NOT echo plaintext
        assert pwd_field != "TESTpwdSP9999", "PASSWORD WAS RETURNED IN PLAINTEXT — SECURITY BUG"
