"""
Restaurant QR Ordering System - NEW Features API Tests
Tests for: Package Requests, Waiter Panel, Order Tracking, Enhanced Cashier/Admin
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@qr-restaurant.com"
ADMIN_PASSWORD = "admin123"
WAITER_EMAIL = "waiter@lezzet.com"
WAITER_PASSWORD = "waiter123"
CASHIER_EMAIL = "cashier@lezzet.com"
CASHIER_PASSWORD = "cashier123"
OWNER_EMAIL = "owner@lezzet.com"
OWNER_PASSWORD = "owner123"


class TestPackageRequests:
    """Package Request endpoint tests"""
    
    def test_create_package_request(self):
        """Test creating a package request (public endpoint)"""
        response = requests.post(f"{BASE_URL}/api/package-requests", json={
            "business_name": "TEST_API_Restoran",
            "contact_name": "Test Yetkili",
            "phone": "0555 111 2222",
            "email": "test_api@test.com",
            "city": "Izmir",
            "note": "API test note",
            "package_type": "gold"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["business_name"] == "TEST_API_Restoran"
        assert data["package_type"] == "gold"
        assert data["status"] == "pending"
        assert "id" in data
        print(f"✓ Package request created: {data['id'][:8]}...")
    
    def test_admin_get_package_requests(self):
        """Test admin can get all package requests"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get package requests
        response = requests.get(f"{BASE_URL}/api/admin/package-requests", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} package requests")
    
    def test_non_admin_cannot_get_package_requests(self):
        """Test non-admin cannot access package requests"""
        # Login as owner
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/package-requests", headers=headers)
        assert response.status_code == 403
        print(f"✓ Non-admin correctly denied access to package requests")


class TestWaiterPanel:
    """Waiter panel endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get waiter token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": WAITER_EMAIL,
            "password": WAITER_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Waiter login failed")
    
    def test_waiter_login(self):
        """Test waiter can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": WAITER_EMAIL,
            "password": WAITER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "waiter"
        print(f"✓ Waiter login successful")
    
    def test_get_waiter_calls(self):
        """Test waiter can get calls"""
        response = requests.get(f"{BASE_URL}/api/waiter/calls", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "active" in data
        assert "completed" in data
        print(f"✓ Waiter calls: {len(data['active'])} active, {len(data['completed'])} completed")
    
    def test_update_call_status(self):
        """Test waiter can update call status"""
        # First get calls
        calls_response = requests.get(f"{BASE_URL}/api/waiter/calls", headers=self.headers)
        calls = calls_response.json()
        
        if calls["active"]:
            call_id = calls["active"][0]["id"]
            
            # Accept call
            response = requests.put(
                f"{BASE_URL}/api/waiter/calls/{call_id}/status",
                json={"status": "accepted"},
                headers=self.headers
            )
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            print(f"✓ Call status updated to accepted")
        else:
            print("✓ No active calls to test status update (skipped)")
    
    def test_non_waiter_cannot_access_waiter_calls(self):
        """Test non-waiter cannot access waiter calls"""
        # Login as cashier
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CASHIER_EMAIL,
            "password": CASHIER_PASSWORD
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/waiter/calls", headers=headers)
        assert response.status_code == 403
        print(f"✓ Non-waiter correctly denied access to waiter calls")


class TestOrderTracking:
    """Order tracking endpoint tests"""
    
    def get_order_id(self):
        """Helper to get a valid order ID"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code != 200:
            return None
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        if orders_response.status_code == 200 and orders_response.json():
            return orders_response.json()[0]["id"]
        return None
    
    def test_track_order(self):
        """Test order tracking endpoint (public)"""
        order_id = self.get_order_id()
        if not order_id:
            pytest.skip("No orders available for tracking test")
        
        response = requests.get(f"{BASE_URL}/api/orders/{order_id}/track")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "order" in data
        assert "restaurant_name" in data
        assert "status_steps" in data
        assert "current_step" in data
        assert "estimated_minutes" in data
        assert len(data["status_steps"]) == 5
        print(f"✓ Order tracking: step {data['current_step']}, ~{data['estimated_minutes']} min")
    
    def test_track_invalid_order(self):
        """Test tracking invalid order returns 404"""
        response = requests.get(f"{BASE_URL}/api/orders/invalid-order-id-12345/track")
        assert response.status_code == 404
        print(f"✓ Invalid order correctly returns 404")


class TestEnhancedCashier:
    """Enhanced cashier endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get cashier token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CASHIER_EMAIL,
            "password": CASHIER_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Cashier login failed")
    
    def test_get_all_orders(self):
        """Test cashier can get all orders (history)"""
        response = requests.get(f"{BASE_URL}/api/cashier/all-orders", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Cashier all orders: {len(data)} orders")
    
    def test_get_restaurant_info(self):
        """Test cashier can get restaurant info"""
        response = requests.get(f"{BASE_URL}/api/cashier/restaurant-info", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        if data:
            assert "name" in data
            print(f"✓ Restaurant info: {data['name']}")
        else:
            print(f"✓ Restaurant info: None (cashier may not have restaurant)")
    
    def test_non_cashier_cannot_access_cashier_endpoints(self):
        """Test non-cashier cannot access cashier endpoints"""
        # Login as kitchen
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "kitchen@lezzet.com",
            "password": "kitchen123"
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/cashier/all-orders", headers=headers)
        assert response.status_code == 403
        print(f"✓ Non-cashier correctly denied access to cashier endpoints")


class TestWaiterCallTypes:
    """Test different waiter call types"""
    
    def get_table_id(self):
        """Helper to get a valid table ID"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        if login_response.status_code != 200:
            return None
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        tables_response = requests.get(f"{BASE_URL}/api/owner/tables", headers=headers)
        if tables_response.status_code == 200 and tables_response.json():
            return tables_response.json()[0]["id"]
        return None
    
    def test_call_waiter(self):
        """Test waiter call type"""
        table_id = self.get_table_id()
        if not table_id:
            pytest.skip("No tables available")
        
        response = requests.post(f"{BASE_URL}/api/waiter-call", json={
            "table_id": table_id,
            "call_type": "waiter"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["call_type"] == "waiter"
        print(f"✓ Waiter call created")
    
    def test_call_water(self):
        """Test water call type"""
        table_id = self.get_table_id()
        if not table_id:
            pytest.skip("No tables available")
        
        response = requests.post(f"{BASE_URL}/api/waiter-call", json={
            "table_id": table_id,
            "call_type": "water"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["call_type"] == "water"
        print(f"✓ Water call created")
    
    def test_call_bill(self):
        """Test bill call type"""
        table_id = self.get_table_id()
        if not table_id:
            pytest.skip("No tables available")
        
        response = requests.post(f"{BASE_URL}/api/waiter-call", json={
            "table_id": table_id,
            "call_type": "bill"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["call_type"] == "bill"
        print(f"✓ Bill call created")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
