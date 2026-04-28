"""
Restaurant QR Ordering System - Backend API Tests
Tests all API endpoints for Admin, Owner, Kitchen, Cashier, and Customer flows
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@qr-restaurant.com"
ADMIN_PASSWORD = "admin123"
OWNER_EMAIL = "owner@lezzet.com"
OWNER_PASSWORD = "owner123"
KITCHEN_EMAIL = "kitchen@lezzet.com"
KITCHEN_PASSWORD = "kitchen123"
CASHIER_EMAIL = "cashier@lezzet.com"
CASHIER_PASSWORD = "cashier123"


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful - token received")
    
    def test_owner_login_success(self):
        """Test owner login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "owner"
        print(f"✓ Owner login successful")
    
    def test_kitchen_login_success(self):
        """Test kitchen staff login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": KITCHEN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "kitchen"
        print(f"✓ Kitchen login successful")
    
    def test_cashier_login_success(self):
        """Test cashier login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CASHIER_EMAIL,
            "password": CASHIER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "cashier"
        print(f"✓ Cashier login successful")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print(f"✓ Invalid credentials correctly rejected")


class TestAdminEndpoints:
    """Admin panel API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin login failed")
    
    def test_get_admin_stats(self):
        """Test admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total_restaurants" in data
        assert "total_orders" in data
        assert "total_revenue" in data
        print(f"✓ Admin stats: {data['total_restaurants']} restaurants, {data['total_orders']} orders")
    
    def test_get_admin_analytics(self):
        """Test admin analytics endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "daily_orders" in data
        assert "restaurant_stats" in data
        print(f"✓ Admin analytics retrieved")
    
    def test_get_restaurants(self):
        """Test get all restaurants"""
        response = requests.get(f"{BASE_URL}/api/admin/restaurants", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} restaurants")
    
    def test_get_all_orders(self):
        """Test get all orders (admin)"""
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} orders")
    
    def test_get_all_reviews(self):
        """Test get all reviews (admin)"""
        response = requests.get(f"{BASE_URL}/api/admin/reviews", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} reviews")
    
    def test_admin_endpoint_requires_auth(self):
        """Test admin endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403]
        print(f"✓ Admin endpoints correctly require auth")


class TestOwnerEndpoints:
    """Owner panel API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get owner token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            self.user = response.json()["user"]
        else:
            pytest.skip("Owner login failed")
    
    def test_get_owner_stats(self):
        """Test owner stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/owner/stats", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "today" in data
        assert "week" in data
        assert "status_distribution" in data
        print(f"✓ Owner stats: Today {data['today']['orders']} orders, {data['today']['revenue']} ₺")
    
    def test_get_menu_categories(self):
        """Test get menu categories"""
        response = requests.get(f"{BASE_URL}/api/owner/menu/categories", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} categories")
        return data
    
    def test_get_menu_items(self):
        """Test get menu items"""
        response = requests.get(f"{BASE_URL}/api/owner/menu/items", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} menu items")
    
    def test_get_tables(self):
        """Test get tables"""
        response = requests.get(f"{BASE_URL}/api/owner/tables", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} tables")
        return data
    
    def test_get_owner_orders(self):
        """Test get owner orders"""
        response = requests.get(f"{BASE_URL}/api/owner/orders", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} orders")
    
    def test_create_and_delete_category(self):
        """Test category CRUD operations"""
        # Create category
        create_response = requests.post(
            f"{BASE_URL}/api/owner/menu/categories",
            json={"name": "TEST_Category", "order": 99},
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        category = create_response.json()
        assert category["name"] == "TEST_Category"
        category_id = category["id"]
        print(f"✓ Created category: {category_id}")
        
        # Delete category
        delete_response = requests.delete(
            f"{BASE_URL}/api/owner/menu/categories/{category_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"✓ Deleted category: {category_id}")
    
    def test_create_and_delete_table(self):
        """Test table CRUD operations"""
        # Create table
        create_response = requests.post(
            f"{BASE_URL}/api/owner/tables",
            json={"table_number": "TEST-99"},
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        table = create_response.json()
        assert table["table_number"] == "TEST-99"
        assert "qr_code" in table
        assert table["qr_code"].startswith("data:image/png;base64,")
        table_id = table["id"]
        print(f"✓ Created table with QR code: {table_id}")
        
        # Delete table
        delete_response = requests.delete(
            f"{BASE_URL}/api/owner/tables/{table_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"✓ Deleted table: {table_id}")


class TestKitchenEndpoints:
    """Kitchen panel API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get kitchen token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": KITCHEN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Kitchen login failed")
    
    def test_get_kitchen_orders(self):
        """Test get kitchen orders (pending/preparing)"""
        response = requests.get(f"{BASE_URL}/api/kitchen/orders", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        # All orders should be pending or preparing
        for order in data:
            assert order["status"] in ["pending", "preparing"]
        print(f"✓ Retrieved {len(data)} kitchen orders")


class TestCashierEndpoints:
    """Cashier panel API tests"""
    
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
    
    def test_get_cashier_orders(self):
        """Test get cashier orders (cash payment, not completed)"""
        response = requests.get(f"{BASE_URL}/api/cashier/orders", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        # All orders should be cash payment and not completed
        for order in data:
            assert order["payment_method"] == "cash"
            assert order["status"] != "completed"
        print(f"✓ Retrieved {len(data)} cashier orders")


class TestPublicEndpoints:
    """Public (customer-facing) API tests"""
    
    def get_valid_table_id(self):
        """Helper to get a valid table ID from owner"""
        # Login as owner
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        if login_response.status_code != 200:
            return None
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get tables
        tables_response = requests.get(f"{BASE_URL}/api/owner/tables", headers=headers)
        if tables_response.status_code == 200:
            tables = tables_response.json()
            if tables:
                return tables[0]["id"]
        
        # Create a table if none exist
        create_response = requests.post(
            f"{BASE_URL}/api/owner/tables",
            json={"table_number": "TEST-MENU"},
            headers=headers
        )
        if create_response.status_code == 200:
            return create_response.json()["id"]
        
        return None
    
    def test_get_menu_by_table(self):
        """Test get menu by table ID (public endpoint)"""
        table_id = self.get_valid_table_id()
        if not table_id:
            pytest.skip("No valid table ID available")
        
        response = requests.get(f"{BASE_URL}/api/menu/{table_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "restaurant" in data
        assert "table" in data
        assert "categories" in data
        assert "items" in data
        print(f"✓ Menu retrieved for table {table_id}: {data['restaurant']['name']}")
    
    def test_get_menu_invalid_table(self):
        """Test get menu with invalid table ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/menu/invalid-table-id-12345")
        assert response.status_code == 404
        print(f"✓ Invalid table correctly returns 404")
    
    def test_waiter_call(self):
        """Test waiter call endpoint"""
        table_id = self.get_valid_table_id()
        if not table_id:
            pytest.skip("No valid table ID available")
        
        response = requests.post(f"{BASE_URL}/api/waiter-call", json={
            "table_id": table_id
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["status"] == "pending"
        print(f"✓ Waiter call created for table {table_id}")


class TestOrderFlow:
    """End-to-end order flow tests"""
    
    def get_test_data(self):
        """Get table and menu items for testing"""
        # Login as owner
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        if login_response.status_code != 200:
            return None, None, None
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get or create table
        tables_response = requests.get(f"{BASE_URL}/api/owner/tables", headers=headers)
        tables = tables_response.json() if tables_response.status_code == 200 else []
        
        if not tables:
            create_response = requests.post(
                f"{BASE_URL}/api/owner/tables",
                json={"table_number": "TEST-ORDER"},
                headers=headers
            )
            if create_response.status_code == 200:
                table_id = create_response.json()["id"]
            else:
                return None, None, None
        else:
            table_id = tables[0]["id"]
        
        # Get menu items
        items_response = requests.get(f"{BASE_URL}/api/owner/menu/items", headers=headers)
        items = items_response.json() if items_response.status_code == 200 else []
        
        return table_id, items, headers
    
    def test_create_order(self):
        """Test creating an order"""
        table_id, items, headers = self.get_test_data()
        
        if not table_id:
            pytest.skip("No valid table ID available")
        
        # Create order items (use existing items or create mock)
        if items:
            order_items = [{
                "menu_item_id": items[0]["id"],
                "name": items[0]["name"],
                "price": items[0]["price"],
                "quantity": 2,
                "preparation_time_minutes": items[0].get("preparation_time_minutes", 10)
            }]
        else:
            order_items = [{
                "menu_item_id": "test-item-id",
                "name": "Test Item",
                "price": 25.00,
                "quantity": 2,
                "preparation_time_minutes": 10
            }]
        
        response = requests.post(f"{BASE_URL}/api/orders", json={
            "table_id": table_id,
            "items": order_items,
            "payment_method": "cash"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["status"] == "pending"
        assert data["payment_method"] == "cash"
        print(f"✓ Order created: {data['id'][:8]}... Total: {data['total_amount']} ₺")
        return data["id"]
    
    def test_create_review(self):
        """Test creating a review"""
        # Get restaurant ID
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Owner login failed")
        
        user = login_response.json()["user"]
        restaurant_id = user.get("restaurant_id")
        
        if not restaurant_id:
            pytest.skip("No restaurant ID available")
        
        response = requests.post(f"{BASE_URL}/api/reviews", json={
            "restaurant_id": restaurant_id,
            "rating": 5,
            "comment": "TEST_Review - Excellent service!"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["rating"] == 5
        print(f"✓ Review created: {data['id'][:8]}...")


class TestRoleBasedAccess:
    """Test role-based access control"""
    
    def test_owner_cannot_access_admin_endpoints(self):
        """Test owner cannot access admin-only endpoints"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access admin stats
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 403
        print(f"✓ Owner correctly denied access to admin endpoints")
    
    def test_kitchen_cannot_access_owner_endpoints(self):
        """Test kitchen cannot access owner-only endpoints"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": KITCHEN_PASSWORD
        })
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access owner stats
        response = requests.get(f"{BASE_URL}/api/owner/stats", headers=headers)
        assert response.status_code == 403
        print(f"✓ Kitchen correctly denied access to owner endpoints")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
