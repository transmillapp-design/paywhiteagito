"""
Test Suite for Suporte (Support Ticket) System - Transmill Platform
Tests all CRUD operations for support tickets between franchises and master admin
"""

import pytest
import requests
import os
import uuid

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://api-decompose-1.preview.emergentagent.com')

# Test credentials
FRANCHISE_USER = {
    "email": "transmillapp@gmail.com",
    "password": "demo123"
}

MASTER_ADMIN = {
    "email": "marcelotransmillapp@gmail.com",
    "password": "!Ma04202011@"
}

# Test data
TEST_CHAMADO_ID = None  # Will be set during tests


class TestSuporteAuthentication:
    """Test authentication requirements for suporte endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_chamados_requires_auth(self):
        """GET /api/suporte/chamados requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/suporte/chamados")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ GET /api/suporte/chamados requires authentication")
    
    def test_create_chamado_requires_auth(self):
        """POST /api/suporte/chamados requires authentication"""
        response = self.session.post(f"{BASE_URL}/api/suporte/chamados", json={
            "titulo": "Test",
            "descricao": "Test description"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ POST /api/suporte/chamados requires authentication")


class TestFranchiseSuporteOperations:
    """Test suporte operations for franchise users"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures with franchise user authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as franchise user
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=FRANCHISE_USER)
        assert login_response.status_code == 200, f"Franchise login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        assert token, "No access token received"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.user_data = login_response.json().get("user", {})
        print(f"✅ Logged in as franchise user: {self.user_data.get('email')}")
    
    def test_franchise_can_create_chamado(self):
        """Franchise user can create a support ticket"""
        global TEST_CHAMADO_ID
        
        chamado_data = {
            "titulo": f"TEST_Chamado_{uuid.uuid4().hex[:8]}",
            "categoria": "tecnico",
            "descricao": "Este é um chamado de teste criado pelo sistema de testes automatizados.",
            "prioridade": "media"
        }
        
        response = self.session.post(f"{BASE_URL}/api/suporte/chamados", json=chamado_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "chamado" in data, "Response should contain 'chamado'"
        
        chamado = data["chamado"]
        assert chamado.get("titulo") == chamado_data["titulo"], "Titulo mismatch"
        assert chamado.get("categoria") == chamado_data["categoria"], "Categoria mismatch"
        assert chamado.get("descricao") == chamado_data["descricao"], "Descricao mismatch"
        assert chamado.get("prioridade") == chamado_data["prioridade"], "Prioridade mismatch"
        assert chamado.get("status") == "aberto", "Initial status should be 'aberto'"
        assert "id" in chamado, "Chamado should have an ID"
        assert "mensagens" in chamado, "Chamado should have mensagens array"
        assert len(chamado["mensagens"]) == 1, "Initial chamado should have 1 message"
        
        TEST_CHAMADO_ID = chamado["id"]
        print(f"✅ Franchise created chamado: {TEST_CHAMADO_ID}")
    
    def test_franchise_can_list_own_chamados(self):
        """Franchise user can list their own support tickets"""
        response = self.session.get(f"{BASE_URL}/api/suporte/chamados")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "chamados" in data, "Response should contain 'chamados'"
        assert "stats" in data, "Response should contain 'stats'"
        
        stats = data["stats"]
        assert "total" in stats, "Stats should have 'total'"
        assert "abertos" in stats, "Stats should have 'abertos'"
        assert "em_andamento" in stats, "Stats should have 'em_andamento'"
        assert "resolvidos" in stats, "Stats should have 'resolvidos'"
        
        print(f"✅ Franchise can list chamados. Total: {stats['total']}, Abertos: {stats['abertos']}")
    
    def test_franchise_can_get_chamado_details(self):
        """Franchise user can get details of their own ticket"""
        global TEST_CHAMADO_ID
        
        if not TEST_CHAMADO_ID:
            pytest.skip("No test chamado ID available")
        
        response = self.session.get(f"{BASE_URL}/api/suporte/chamados/{TEST_CHAMADO_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "chamado" in data, "Response should contain 'chamado'"
        
        chamado = data["chamado"]
        assert chamado.get("id") == TEST_CHAMADO_ID, "Chamado ID mismatch"
        
        print(f"✅ Franchise can get chamado details: {chamado.get('titulo')}")
    
    def test_franchise_can_add_message(self):
        """Franchise user can add a message to their ticket"""
        global TEST_CHAMADO_ID
        
        if not TEST_CHAMADO_ID:
            pytest.skip("No test chamado ID available")
        
        message_data = {
            "chamado_id": TEST_CHAMADO_ID,
            "conteudo": "Esta é uma mensagem de teste adicionada pela franquia."
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/suporte/chamados/{TEST_CHAMADO_ID}/mensagens",
            json=message_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "nova_mensagem" in data, "Response should contain 'nova_mensagem'"
        assert "novo_status" in data, "Response should contain 'novo_status'"
        
        nova_mensagem = data["nova_mensagem"]
        assert nova_mensagem.get("conteudo") == message_data["conteudo"], "Message content mismatch"
        assert nova_mensagem.get("autor_tipo") == "franquia", "Author type should be 'franquia'"
        
        print(f"✅ Franchise added message to chamado. New status: {data['novo_status']}")
    
    def test_franchise_can_filter_by_status(self):
        """Franchise user can filter tickets by status"""
        response = self.session.get(f"{BASE_URL}/api/suporte/chamados?status=aberto")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        
        # All returned chamados should have status 'aberto'
        for chamado in data.get("chamados", []):
            assert chamado.get("status") == "aberto", f"Expected status 'aberto', got {chamado.get('status')}"
        
        print(f"✅ Franchise can filter chamados by status. Found {len(data.get('chamados', []))} abertos")


class TestMasterSuporteOperations:
    """Test suporte operations for master admin"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures with master admin authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as master admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=MASTER_ADMIN)
        assert login_response.status_code == 200, f"Master login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        assert token, "No access token received"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.user_data = login_response.json().get("user", {})
        print(f"✅ Logged in as master admin: {self.user_data.get('email')}")
    
    def test_master_can_list_all_chamados(self):
        """Master admin can list all support tickets from all franchises"""
        response = self.session.get(f"{BASE_URL}/api/suporte/chamados")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "chamados" in data, "Response should contain 'chamados'"
        assert "stats" in data, "Response should contain 'stats'"
        
        print(f"✅ Master can list all chamados. Total: {data['stats']['total']}")
    
    def test_master_can_get_any_chamado(self):
        """Master admin can get details of any ticket"""
        global TEST_CHAMADO_ID
        
        if not TEST_CHAMADO_ID:
            pytest.skip("No test chamado ID available")
        
        response = self.session.get(f"{BASE_URL}/api/suporte/chamados/{TEST_CHAMADO_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        
        print(f"✅ Master can get chamado details: {data['chamado'].get('titulo')}")
    
    def test_master_can_respond_to_chamado(self):
        """Master admin can respond to a support ticket"""
        global TEST_CHAMADO_ID
        
        if not TEST_CHAMADO_ID:
            pytest.skip("No test chamado ID available")
        
        message_data = {
            "chamado_id": TEST_CHAMADO_ID,
            "conteudo": "Esta é uma resposta do suporte master ao chamado."
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/suporte/chamados/{TEST_CHAMADO_ID}/mensagens",
            json=message_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        
        nova_mensagem = data["nova_mensagem"]
        assert nova_mensagem.get("autor_tipo") == "master", "Author type should be 'master'"
        
        # When master responds, status should change to 'aguardando_resposta'
        assert data.get("novo_status") == "aguardando_resposta", f"Expected status 'aguardando_resposta', got {data.get('novo_status')}"
        
        print(f"✅ Master responded to chamado. New status: {data['novo_status']}")
    
    def test_master_can_update_status(self):
        """Master admin can update ticket status"""
        global TEST_CHAMADO_ID
        
        if not TEST_CHAMADO_ID:
            pytest.skip("No test chamado ID available")
        
        status_data = {"status": "em_andamento"}
        
        response = self.session.patch(
            f"{BASE_URL}/api/suporte/chamados/{TEST_CHAMADO_ID}/status",
            json=status_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert data.get("novo_status") == "em_andamento", f"Expected status 'em_andamento', got {data.get('novo_status')}"
        
        print(f"✅ Master updated chamado status to: {data['novo_status']}")
    
    def test_master_can_resolve_chamado(self):
        """Master admin can mark ticket as resolved"""
        global TEST_CHAMADO_ID
        
        if not TEST_CHAMADO_ID:
            pytest.skip("No test chamado ID available")
        
        status_data = {"status": "resolvido"}
        
        response = self.session.patch(
            f"{BASE_URL}/api/suporte/chamados/{TEST_CHAMADO_ID}/status",
            json=status_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert data.get("novo_status") == "resolvido", f"Expected status 'resolvido', got {data.get('novo_status')}"
        
        print(f"✅ Master resolved chamado. Status: {data['novo_status']}")
    
    def test_master_cannot_create_chamado(self):
        """Master admin cannot create support tickets (only respond)"""
        chamado_data = {
            "titulo": "Test from Master",
            "categoria": "geral",
            "descricao": "Master trying to create a ticket",
            "prioridade": "baixa"
        }
        
        response = self.session.post(f"{BASE_URL}/api/suporte/chamados", json=chamado_data)
        
        # Master should get 403 Forbidden when trying to create a ticket
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        
        print("✅ Master correctly cannot create chamados (403 Forbidden)")


class TestSuporteValidation:
    """Test validation and edge cases for suporte system"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures with franchise user authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as franchise user
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=FRANCHISE_USER)
        assert login_response.status_code == 200, f"Franchise login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_invalid_chamado_id_returns_404(self):
        """Getting non-existent chamado returns 404"""
        fake_id = str(uuid.uuid4())
        response = self.session.get(f"{BASE_URL}/api/suporte/chamados/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Non-existent chamado returns 404")
    
    def test_invalid_status_returns_400(self):
        """Updating with invalid status returns 400"""
        global TEST_CHAMADO_ID
        
        if not TEST_CHAMADO_ID:
            pytest.skip("No test chamado ID available")
        
        # Login as master to update status
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=MASTER_ADMIN)
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        status_data = {"status": "invalid_status"}
        
        response = self.session.patch(
            f"{BASE_URL}/api/suporte/chamados/{TEST_CHAMADO_ID}/status",
            json=status_data
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Invalid status returns 400")


class TestExistingChamado:
    """Test with the existing chamado mentioned in context"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as master admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=MASTER_ADMIN)
        assert login_response.status_code == 200, f"Master login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        self.existing_chamado_id = "dbeb742b-de56-4101-936b-18459e824e27"
    
    def test_existing_chamado_accessible(self):
        """Verify the existing test chamado is accessible"""
        response = self.session.get(f"{BASE_URL}/api/suporte/chamados/{self.existing_chamado_id}")
        
        if response.status_code == 404:
            pytest.skip("Existing test chamado not found in database")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        chamado = data.get("chamado", {})
        
        print(f"✅ Existing chamado found: {chamado.get('titulo')}")
        print(f"   Status: {chamado.get('status')}")
        print(f"   Prioridade: {chamado.get('prioridade')}")
        print(f"   Mensagens: {len(chamado.get('mensagens', []))}")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup(request):
    """Cleanup test data after all tests"""
    def cleanup_test_chamados():
        global TEST_CHAMADO_ID
        if TEST_CHAMADO_ID:
            print(f"\n🧹 Test chamado created: {TEST_CHAMADO_ID}")
            print("   (Keeping for manual verification - prefix TEST_)")
    
    request.addfinalizer(cleanup_test_chamados)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
