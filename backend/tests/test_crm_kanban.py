"""
CRM Kanban Tests - Proteção Veicular
Tests for Labelview CRM Kanban endpoints:
- GET /api/labelview/crm/leads - List leads with hierarchical filters
- POST /api/labelview/crm/lead - Create new lead manually
- PUT /api/labelview/crm/lead/{id}/status - Update lead status (drag-and-drop)
- DELETE /api/labelview/crm/lead/{id} - Delete lead
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://api-decompose-1.preview.emergentagent.com')

# Test credentials from review request
MASTER_CREDENTIALS = {
    "email": "marcelotransmillapp@gmail.com",
    "password": "!Ma04202011@"
}

FRANQUIA_RJ_CREDENTIALS = {
    "email": "transmillapp@gmail.com",
    "password": "demo123"
}

class TestCRMKanbanAuthentication:
    """Test authentication requirements for CRM endpoints"""
    
    def test_get_leads_requires_auth(self):
        """GET /api/labelview/crm/leads requires authentication"""
        response = requests.get(f"{BASE_URL}/api/labelview/crm/leads")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ GET /api/labelview/crm/leads requires authentication")
    
    def test_create_lead_requires_auth(self):
        """POST /api/labelview/crm/lead requires authentication"""
        response = requests.post(f"{BASE_URL}/api/labelview/crm/lead", json={
            "nome": "Test Lead",
            "cpf": "12345678901"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ POST /api/labelview/crm/lead requires authentication")

    def test_update_lead_status_requires_auth(self):
        """PUT /api/labelview/crm/lead/{id}/status requires authentication"""
        response = requests.put(f"{BASE_URL}/api/labelview/crm/lead/fake-id/status", json={
            "status": "interesse"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ PUT /api/labelview/crm/lead/{id}/status requires authentication")

    def test_delete_lead_requires_auth(self):
        """DELETE /api/labelview/crm/lead/{id} requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/labelview/crm/lead/fake-id")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ DELETE /api/labelview/crm/lead/{id} requires authentication")


class TestMasterCRMAccess:
    """Test CRM access for Master admin user"""
    
    @pytest.fixture(scope="class")
    def master_token(self):
        """Authenticate as master admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MASTER_CREDENTIALS)
        assert response.status_code == 200, f"Master login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, f"No access_token in response: {data}"
        print(f"✅ Master login successful: {MASTER_CREDENTIALS['email']}")
        return data["access_token"]
    
    def test_master_can_list_all_leads(self, master_token):
        """Master can list all leads from all units"""
        headers = {"Authorization": f"Bearer {master_token}"}
        response = requests.get(f"{BASE_URL}/api/labelview/crm/leads", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "success" in data
        assert "leads" in data
        assert isinstance(data["leads"], list)
        print(f"✅ Master can list leads: {len(data['leads'])} leads found")
    
    def test_master_can_create_lead(self, master_token):
        """Master can create a new lead"""
        headers = {"Authorization": f"Bearer {master_token}"}
        lead_data = {
            "nome": f"TEST_Master_Lead_{uuid.uuid4().hex[:8]}",
            "cpf": "12345678901",
            "email": "test@example.com",
            "telefone": "(11) 99999-8888",
            "observacoes": "Test lead created by master"
        }
        
        response = requests.post(f"{BASE_URL}/api/labelview/crm/lead", json=lead_data, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=True: {data}"
        assert "lead" in data
        assert data["lead"]["nome"] == lead_data["nome"]
        assert data["lead"]["status"] == "novo"
        print(f"✅ Master created lead: {data['lead']['id']}")
        return data["lead"]["id"]
    
    def test_master_can_update_lead_status(self, master_token):
        """Master can update lead status (drag-and-drop simulation)"""
        headers = {"Authorization": f"Bearer {master_token}"}
        
        # First create a lead to update
        lead_data = {
            "nome": f"TEST_StatusUpdate_{uuid.uuid4().hex[:8]}",
            "cpf": "98765432100"
        }
        create_response = requests.post(f"{BASE_URL}/api/labelview/crm/lead", json=lead_data, headers=headers)
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead"]["id"]
        
        # Test all valid status transitions
        valid_statuses = ['interesse', 'negociacao', 'aguardando_docs', 'aprovado', 'cancelado']
        
        for status in valid_statuses:
            response = requests.put(
                f"{BASE_URL}/api/labelview/crm/lead/{lead_id}/status",
                json={"status": status},
                headers=headers
            )
            assert response.status_code == 200, f"Failed to update to {status}: {response.text}"
            data = response.json()
            assert data.get("success") == True, f"Expected success=True for status {status}: {data}"
            print(f"✅ Status updated to: {status}")
        
        print(f"✅ Master can update all valid statuses for lead: {lead_id}")
        return lead_id
    
    def test_master_can_delete_lead(self, master_token):
        """Master can delete a lead"""
        headers = {"Authorization": f"Bearer {master_token}"}
        
        # Create a lead to delete
        lead_data = {
            "nome": f"TEST_ToDelete_{uuid.uuid4().hex[:8]}",
            "cpf": "11111111111"
        }
        create_response = requests.post(f"{BASE_URL}/api/labelview/crm/lead", json=lead_data, headers=headers)
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead"]["id"]
        
        # Delete the lead
        response = requests.delete(f"{BASE_URL}/api/labelview/crm/lead/{lead_id}", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Master deleted lead: {lead_id}")
        
        # Verify deletion by trying to get leads
        list_response = requests.get(f"{BASE_URL}/api/labelview/crm/leads", headers=headers)
        leads = list_response.json().get("leads", [])
        deleted_lead = next((l for l in leads if l.get("id") == lead_id), None)
        assert deleted_lead is None, f"Lead should be deleted but was found: {deleted_lead}"
        print("✅ Lead verified as deleted")


class TestInvalidStatusUpdate:
    """Test invalid status update scenarios"""
    
    @pytest.fixture(scope="class")
    def master_token(self):
        """Authenticate as master admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MASTER_CREDENTIALS)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_invalid_status_rejected(self, master_token):
        """Invalid status values should be rejected"""
        headers = {"Authorization": f"Bearer {master_token}"}
        
        # Create a lead first
        lead_data = {"nome": f"TEST_InvalidStatus_{uuid.uuid4().hex[:8]}"}
        create_response = requests.post(f"{BASE_URL}/api/labelview/crm/lead", json=lead_data, headers=headers)
        lead_id = create_response.json()["lead"]["id"]
        
        # Try invalid status
        response = requests.put(
            f"{BASE_URL}/api/labelview/crm/lead/{lead_id}/status",
            json={"status": "invalid_status"},
            headers=headers
        )
        
        data = response.json()
        # Should either return 400/422 or success=False
        if response.status_code == 200:
            assert data.get("success") == False, "Invalid status should not succeed"
        else:
            assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        
        print("✅ Invalid status values are properly rejected")
    
    def test_nonexistent_lead_returns_error(self, master_token):
        """Updating non-existent lead should return error"""
        headers = {"Authorization": f"Bearer {master_token}"}
        
        response = requests.put(
            f"{BASE_URL}/api/labelview/crm/lead/non-existent-id/status",
            json={"status": "interesse"},
            headers=headers
        )
        
        data = response.json()
        # Should return success=False with message
        assert data.get("success") == False, f"Non-existent lead should fail: {data}"
        print("✅ Non-existent lead returns proper error")


class TestSearchAndFilters:
    """Test lead search and filtering functionality"""
    
    @pytest.fixture(scope="class")
    def master_token(self):
        """Authenticate as master admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MASTER_CREDENTIALS)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_leads_response_structure(self, master_token):
        """Verify leads response has correct structure"""
        headers = {"Authorization": f"Bearer {master_token}"}
        response = requests.get(f"{BASE_URL}/api/labelview/crm/leads", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert "leads" in data
        
        # If leads exist, verify structure
        if data["leads"]:
            lead = data["leads"][0]
            # Required fields for Kanban display
            expected_fields = ["id", "nome", "status", "created_at"]
            for field in expected_fields:
                assert field in lead, f"Lead missing required field: {field}"
            
            # Verify status is one of valid Kanban columns
            valid_statuses = ['novo', 'interesse', 'negociacao', 'aguardando_docs', 'aprovado', 'cancelado']
            assert lead["status"] in valid_statuses, f"Invalid status: {lead['status']}"
        
        print(f"✅ Leads response structure is valid")


class TestCRUDFlow:
    """Test complete CRUD flow for leads"""
    
    @pytest.fixture(scope="class")
    def master_token(self):
        """Authenticate as master admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MASTER_CREDENTIALS)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_complete_crud_flow(self, master_token):
        """Test Create -> Read -> Update -> Delete flow"""
        headers = {"Authorization": f"Bearer {master_token}"}
        
        # CREATE
        lead_data = {
            "nome": f"TEST_CRUD_Flow_{uuid.uuid4().hex[:8]}",
            "cpf": "22222222222",
            "email": "crud_test@example.com",
            "telefone": "(21) 98888-7777",
            "observacoes": "CRUD flow test"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/labelview/crm/lead", json=lead_data, headers=headers)
        assert create_response.status_code == 200
        created_lead = create_response.json()["lead"]
        lead_id = created_lead["id"]
        
        # Verify created data
        assert created_lead["nome"] == lead_data["nome"]
        assert created_lead["cpf"] == lead_data["cpf"]
        assert created_lead["email"] == lead_data["email"]
        assert created_lead["status"] == "novo"
        print(f"✅ CREATE: Lead created with ID {lead_id}")
        
        # READ - Verify in list
        list_response = requests.get(f"{BASE_URL}/api/labelview/crm/leads", headers=headers)
        assert list_response.status_code == 200
        leads = list_response.json()["leads"]
        found_lead = next((l for l in leads if l.get("id") == lead_id), None)
        assert found_lead is not None, f"Created lead {lead_id} not found in list"
        assert found_lead["nome"] == lead_data["nome"]
        print(f"✅ READ: Lead found in list")
        
        # UPDATE - Move through Kanban columns
        update_response = requests.put(
            f"{BASE_URL}/api/labelview/crm/lead/{lead_id}/status",
            json={"status": "interesse"},
            headers=headers
        )
        assert update_response.status_code == 200
        assert update_response.json().get("success") == True
        print(f"✅ UPDATE: Status changed to 'interesse'")
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/labelview/crm/leads", headers=headers)
        updated_lead = next((l for l in verify_response.json()["leads"] if l.get("id") == lead_id), None)
        assert updated_lead["status"] == "interesse", f"Status not persisted: {updated_lead['status']}"
        print(f"✅ UPDATE VERIFIED: Status persisted as 'interesse'")
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/labelview/crm/lead/{lead_id}", headers=headers)
        assert delete_response.status_code == 200
        assert delete_response.json().get("success") == True
        print(f"✅ DELETE: Lead deleted")
        
        # Verify deletion
        final_response = requests.get(f"{BASE_URL}/api/labelview/crm/leads", headers=headers)
        deleted_lead = next((l for l in final_response.json()["leads"] if l.get("id") == lead_id), None)
        assert deleted_lead is None, "Lead should be deleted"
        print(f"✅ DELETE VERIFIED: Lead no longer in database")
        
        print("✅ COMPLETE CRUD FLOW PASSED")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def master_token(self):
        """Authenticate as master admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MASTER_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Cannot authenticate for cleanup")
        return response.json()["access_token"]
    
    def test_cleanup_test_leads(self, master_token):
        """Clean up test leads created during testing"""
        headers = {"Authorization": f"Bearer {master_token}"}
        
        # Get all leads
        response = requests.get(f"{BASE_URL}/api/labelview/crm/leads", headers=headers)
        if response.status_code != 200:
            print("⚠️ Could not get leads for cleanup")
            return
        
        leads = response.json().get("leads", [])
        test_leads = [l for l in leads if l.get("nome", "").startswith("TEST_")]
        
        deleted_count = 0
        for lead in test_leads:
            try:
                delete_response = requests.delete(
                    f"{BASE_URL}/api/labelview/crm/lead/{lead['id']}", 
                    headers=headers
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
            except:
                pass
        
        print(f"✅ Cleanup: {deleted_count}/{len(test_leads)} test leads deleted")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
