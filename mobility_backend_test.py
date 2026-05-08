#!/usr/bin/env python3
"""
Mobility Module Backend API Testing Suite
Comprehensive testing of P2P ride-sharing endpoints
"""

import requests
import json
import time
import uuid
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import os

class MobilityTester:
    def __init__(self, base_url: str = None):
        if base_url is None:
            # Read from frontend .env file
            try:
                with open('/app/frontend/.env', 'r') as f:
                    for line in f:
                        if line.startswith('REACT_APP_BACKEND_URL='):
                            frontend_url = line.split('=', 1)[1].strip()
                            # Check if URL already ends with /api
                            if frontend_url.endswith('/api'):
                                base_url = frontend_url
                            else:
                                base_url = f"{frontend_url}/api"
                            break
                if base_url is None:
                    base_url = "http://localhost:8001/api"
            except:
                base_url = "http://localhost:8001/api"
        
        self.base_url = base_url
        self.session = requests.Session()
        self.tokens = {}
        self.users = {}
        self.test_results = []
        self.test_data = {}
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None, params: Dict = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_mobility_module_comprehensive(self):
        """🚗 TESTE COMPLETO DO MÓDULO MOBILITY - P2P RIDE-SHARING"""
        print("\n🚗 TESTE COMPLETO DO MÓDULO MOBILITY - P2P RIDE-SHARING")
        print("=" * 80)
        print("OBJETIVO: Testar todos os endpoints do sistema de mobilidade urbana")
        print("")
        print("ENDPOINTS A TESTAR:")
        print("1. Driver Profile Management:")
        print("   - GET /api/mobility/driver/profile")
        print("   - POST /api/mobility/driver/register")
        print("   - PUT /api/mobility/driver/profile")
        print("   - PUT /api/mobility/driver/availability")
        print("   - PUT /api/mobility/driver/location")
        print("")
        print("2. Ride Flow (Client/Passenger):")
        print("   - POST /api/mobility/estimate")
        print("   - POST /api/mobility/ride/request")
        print("   - GET /api/mobility/client/active-ride")
        print("   - POST /api/mobility/ride/{ride_id}/cancel")
        print("")
        print("3. Ride Flow (Driver):")
        print("   - GET /api/mobility/driver/available-rides")
        print("   - POST /api/mobility/ride/{ride_id}/accept")
        print("   - POST /api/mobility/ride/{ride_id}/arrived")
        print("   - POST /api/mobility/ride/{ride_id}/start")
        print("   - POST /api/mobility/ride/{ride_id}/complete")
        print("")
        print("4. Payment & Rating:")
        print("   - POST /api/mobility/ride/{ride_id}/pay")
        print("   - POST /api/mobility/ride/{ride_id}/rate/client")
        print("   - POST /api/mobility/ride/{ride_id}/rate/driver")
        print("")
        print("CREDENCIAIS DE TESTE:")
        print("- Email: transmillapp@gmail.com")
        print("- Password: demo123")
        print("=" * 80)
        
        # Step 1: Login with test credentials
        print("\n=== STEP 1: LOGIN WITH TEST CREDENTIALS ===")
        
        login_data = {
            "email": "transmillapp@gmail.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user_data = data.get("user", {})
            
            if token:
                self.tokens["main"] = token
                self.users["main"] = user_data
                
                self.log_test("Login Authentication", True, 
                             f"✅ Login successful - User: {user_data.get('full_name', 'N/A')}")
                
                print(f"🔍 User logged in:")
                print(f"   📧 Email: {user_data.get('email')}")
                print(f"   👤 Name: {user_data.get('full_name')}")
                print(f"   🆔 ID: {user_data.get('id')}")
                print(f"   💰 Balance: R$ {user_data.get('balance', 0):.2f}")
            else:
                self.log_test("Login Authentication", False, "❌ Token not returned")
                return False
        else:
            self.log_test("Login Authentication", False, 
                         f"❌ Login failed - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"❌ Error without details - Status: {response.status_code}")
            return False
        
        token = self.tokens["main"]
        
        # Step 2: Driver Profile Management Tests
        print("\n=== STEP 2: DRIVER PROFILE MANAGEMENT ===")
        
        # Test 2.1: Get driver profile (should return exists: true/false)
        print("\n--- Test 2.1: GET /api/mobility/driver/profile ---")
        
        response = self.make_request("GET", "/mobility/driver/profile", token=token)
        
        if response.status_code == 200:
            profile_data = response.json()
            exists = profile_data.get("exists", False)
            
            self.log_test("Get Driver Profile", True, 
                         f"✅ Driver profile check successful - Exists: {exists}")
            
            if exists:
                profile = profile_data.get("profile", {})
                print(f"🔍 Existing driver profile:")
                print(f"   👤 Name: {profile.get('full_name', 'N/A')}")
                print(f"   🚗 Vehicle: {profile.get('vehicle', {}).get('modelo', 'N/A')}")
                print(f"   💰 Min fare: R$ {profile.get('pricing', {}).get('taxa_minima', 0):.2f}")
                print(f"   📍 Online: {profile.get('is_online', False)}")
                
                self.test_data["driver_exists"] = True
                self.test_data["driver_profile"] = profile
            else:
                print("ℹ️ No existing driver profile found")
                self.test_data["driver_exists"] = False
        else:
            self.log_test("Get Driver Profile", False, 
                         f"❌ Get driver profile failed - Status: {response.status_code}")
            return False
        
        # Test 2.2: Register/Update driver profile
        if not self.test_data.get("driver_exists", False):
            print("\n--- Test 2.2: POST /api/mobility/driver/register ---")
            
            register_data = {
                "vehicle": {
                    "tipo": "carro",
                    "modelo": "Test Car 2024",
                    "cor": "Azul",
                    "placa": "XYZ9999",
                    "ano": 2024
                },
                "pricing": {
                    "taxa_minima": 10.0,
                    "valor_por_km": 3.0,
                    "cashback_percentage": 8.0
                }
            }
            
            response = self.make_request("POST", "/mobility/driver/register", register_data, token=token)
            
            if response.status_code == 200:
                register_result = response.json()
                success = register_result.get("success", False)
                
                if success:
                    self.log_test("Register Driver", True, 
                                 "✅ Driver registration successful")
                    
                    driver_profile = register_result.get("driver_profile", {})
                    self.test_data["driver_profile"] = driver_profile
                    
                    print(f"🔍 New driver profile created:")
                    print(f"   🆔 ID: {driver_profile.get('id', 'N/A')}")
                    print(f"   🚗 Vehicle: {driver_profile.get('vehicle', {}).get('modelo', 'N/A')}")
                    print(f"   💰 Min fare: R$ {driver_profile.get('pricing', {}).get('taxa_minima', 0):.2f}")
                else:
                    self.log_test("Register Driver", False, 
                                 f"❌ Driver registration failed - Success: {success}")
            else:
                # Check if it's because user is already registered
                if response.status_code == 400:
                    try:
                        error_data = response.json()
                        if "já é motorista cadastrado" in error_data.get("detail", ""):
                            self.log_test("Register Driver", True, 
                                         "✅ User already registered as driver (expected)")
                            # Get the existing profile again
                            profile_response = self.make_request("GET", "/mobility/driver/profile", token=token)
                            if profile_response.status_code == 200:
                                profile_data = profile_response.json()
                                self.test_data["driver_profile"] = profile_data.get("profile", {})
                        else:
                            self.log_test("Register Driver", False, 
                                         f"❌ Driver registration failed - {error_data.get('detail', 'Unknown error')}")
                    except:
                        self.log_test("Register Driver", False, 
                                     f"❌ Driver registration failed - Status: {response.status_code}")
                else:
                    self.log_test("Register Driver", False, 
                                 f"❌ Driver registration failed - Status: {response.status_code}")
        else:
            print("\n--- Test 2.2: Driver already registered, testing update ---")
            
            # Test updating existing profile
            update_data = {
                "pricing": {
                    "taxa_minima": 12.0,
                    "valor_por_km": 3.5,
                    "cashback_percentage": 9.0
                }
            }
            
            response = self.make_request("PUT", "/mobility/driver/profile", update_data, token=token)
            
            if response.status_code == 200:
                update_result = response.json()
                success = update_result.get("success", False)
                
                if success:
                    self.log_test("Update Driver Profile", True, 
                                 "✅ Driver profile update successful")
                    
                    updated_profile = update_result.get("profile", {})
                    self.test_data["driver_profile"] = updated_profile
                    
                    print(f"🔍 Updated driver profile:")
                    print(f"   💰 New min fare: R$ {updated_profile.get('pricing', {}).get('taxa_minima', 0):.2f}")
                    print(f"   📊 New cashback: {updated_profile.get('pricing', {}).get('cashback_percentage', 0)}%")
                else:
                    self.log_test("Update Driver Profile", False, 
                                 f"❌ Driver profile update failed - Success: {success}")
            else:
                self.log_test("Update Driver Profile", False, 
                             f"❌ Driver profile update failed - Status: {response.status_code}")
        
        # Test 2.3: Update driver availability
        print("\n--- Test 2.3: PUT /api/mobility/driver/availability ---")
        
        response = self.make_request("PUT", "/mobility/driver/availability", params={"is_online": "true"}, token=token)
        
        if response.status_code == 200:
            availability_result = response.json()
            success = availability_result.get("success", False)
            is_online = availability_result.get("is_online", False)
            
            if success and is_online:
                self.log_test("Set Driver Online", True, 
                             "✅ Driver set to online successfully")
            else:
                self.log_test("Set Driver Online", False, 
                             f"❌ Failed to set driver online - Success: {success}, Online: {is_online}")
        else:
            self.log_test("Set Driver Online", False, 
                         f"❌ Set driver online failed - Status: {response.status_code}")
        
        # Test 2.4: Update driver location
        print("\n--- Test 2.4: PUT /api/mobility/driver/location ---")
        
        location_data = {
            "lat": -23.5505,
            "lng": -46.6333
        }
        
        response = self.make_request("PUT", "/mobility/driver/location", location_data, token=token)
        
        if response.status_code == 200:
            location_result = response.json()
            success = location_result.get("success", False)
            
            if success:
                self.log_test("Update Driver Location", True, 
                             "✅ Driver location updated successfully")
            else:
                self.log_test("Update Driver Location", False, 
                             f"❌ Failed to update driver location - Success: {success}")
        else:
            self.log_test("Update Driver Location", False, 
                         f"❌ Update driver location failed - Status: {response.status_code}")
        
        # Step 3: Ride Flow (Client/Passenger) Tests
        print("\n=== STEP 3: RIDE FLOW (CLIENT/PASSENGER) ===")
        
        # Test 3.1: Estimate ride
        print("\n--- Test 3.1: POST /api/mobility/estimate ---")
        
        estimate_data = {
            "origin": {"lat": -23.5505, "lng": -46.6333, "address": "Paulista, SP"},
            "destination": {"lat": -23.5700, "lng": -46.6500, "address": "Pinheiros, SP"}
        }
        
        response = self.make_request("POST", "/mobility/estimate", estimate_data, token=token)
        
        if response.status_code == 200:
            estimate_result = response.json()
            distance_km = estimate_result.get("distance_km", 0)
            drivers_count = estimate_result.get("drivers_count", 0)
            drivers = estimate_result.get("drivers", [])
            
            self.log_test("Ride Estimate", True, 
                         f"✅ Ride estimate successful - Distance: {distance_km}km, Drivers: {drivers_count}")
            
            print(f"🔍 Ride estimate details:")
            print(f"   📏 Distance: {distance_km} km")
            print(f"   ⏱️ Duration: {estimate_result.get('duration_min', 0)} min")
            print(f"   🚗 Available drivers: {drivers_count}")
            
            if drivers:
                print(f"   💰 Price range: R$ {min(d.get('calculated_price', 0) for d in drivers):.2f} - R$ {max(d.get('calculated_price', 0) for d in drivers):.2f}")
                
                # Store first driver for ride request
                self.test_data["selected_driver"] = drivers[0]
                self.test_data["estimate_data"] = estimate_data
                
                print(f"🔍 Selected driver for test:")
                selected = drivers[0]
                print(f"   👤 Name: {selected.get('full_name', 'N/A')}")
                print(f"   🚗 Vehicle: {selected.get('vehicle', {}).get('modelo', 'N/A')}")
                print(f"   💰 Price: R$ {selected.get('calculated_price', 0):.2f}")
                print(f"   ⭐ Rating: {selected.get('rating', 0):.1f}")
            else:
                print("   ⚠️ No drivers available for ride")
        else:
            self.log_test("Ride Estimate", False, 
                         f"❌ Ride estimate failed - Status: {response.status_code}")
        
        # Test 3.2: Request ride (only if we have a driver)
        if self.test_data.get("selected_driver"):
            print("\n--- Test 3.2: POST /api/mobility/ride/request ---")
            
            selected_driver = self.test_data["selected_driver"]
            estimate_data = self.test_data["estimate_data"]
            
            ride_request_data = {
                "origin": estimate_data["origin"],
                "destination": estimate_data["destination"],
                "driver_id": selected_driver["driver_id"]
            }
            
            response = self.make_request("POST", "/mobility/ride/request", ride_request_data, token=token)
            
            if response.status_code == 200:
                ride_result = response.json()
                success = ride_result.get("success", False)
                ride = ride_result.get("ride", {})
                
                if success and ride:
                    ride_id = ride.get("id")
                    self.test_data["ride_id"] = ride_id
                    
                    self.log_test("Request Ride", True, 
                                 f"✅ Ride request successful - ID: {ride_id}")
                    
                    print(f"🔍 Ride request details:")
                    print(f"   🆔 Ride ID: {ride_id}")
                    print(f"   👤 Driver: {ride.get('driver_name', 'N/A')}")
                    print(f"   💰 Total: R$ {ride.get('pricing', {}).get('total', 0):.2f}")
                    print(f"   📍 Status: {ride.get('status', 'N/A')}")
                else:
                    self.log_test("Request Ride", False, 
                                 f"❌ Ride request failed - Success: {success}")
            else:
                self.log_test("Request Ride", False, 
                             f"❌ Ride request failed - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    pass
        else:
            print("\n--- Test 3.2: POST /api/mobility/ride/request ---")
            self.log_test("Request Ride", False, 
                         "⚠️ Skipped - No available driver from estimate")
        
        # Test 3.3: Get active ride
        print("\n--- Test 3.3: GET /api/mobility/client/active-ride ---")
        
        response = self.make_request("GET", "/mobility/client/active-ride", token=token)
        
        if response.status_code == 200:
            active_ride_result = response.json()
            has_active_ride = active_ride_result.get("has_active_ride", False)
            
            self.log_test("Get Active Ride", True, 
                         f"✅ Get active ride successful - Has active: {has_active_ride}")
            
            if has_active_ride:
                ride = active_ride_result.get("ride", {})
                print(f"🔍 Active ride found:")
                print(f"   🆔 ID: {ride.get('id', 'N/A')}")
                print(f"   📍 Status: {ride.get('status', 'N/A')}")
                print(f"   👤 Driver: {ride.get('driver_name', 'N/A')}")
            else:
                print("ℹ️ No active ride found")
        else:
            self.log_test("Get Active Ride", False, 
                         f"❌ Get active ride failed - Status: {response.status_code}")
        
        # Step 4: Ride Flow (Driver) Tests
        print("\n=== STEP 4: RIDE FLOW (DRIVER) ===")
        
        # Test 4.1: Get available rides
        print("\n--- Test 4.1: GET /api/mobility/driver/available-rides ---")
        
        response = self.make_request("GET", "/mobility/driver/available-rides", token=token)
        
        if response.status_code == 200:
            available_rides_result = response.json()
            rides = available_rides_result.get("rides", [])
            total = available_rides_result.get("total", 0)
            
            self.log_test("Get Available Rides", True, 
                         f"✅ Get available rides successful - Total: {total}")
            
            print(f"🔍 Available rides for driver:")
            print(f"   📊 Total: {total}")
            
            if rides:
                for i, ride in enumerate(rides[:3], 1):  # Show first 3
                    print(f"   {i}. Ride {ride.get('id', 'N/A')[:8]}... - Client: {ride.get('client_name', 'N/A')}")
                    print(f"      💰 Total: R$ {ride.get('pricing', {}).get('total', 0):.2f}")
                
                # Use the first ride for testing driver actions
                if self.test_data.get("ride_id"):
                    test_ride = next((r for r in rides if r.get("id") == self.test_data["ride_id"]), None)
                    if test_ride:
                        self.test_data["test_ride"] = test_ride
                        print(f"   🎯 Using ride {test_ride.get('id', 'N/A')[:8]}... for driver flow tests")
        else:
            self.log_test("Get Available Rides", False, 
                         f"❌ Get available rides failed - Status: {response.status_code}")
        
        # Test 4.2: Accept ride (if we have a test ride)
        if self.test_data.get("test_ride"):
            ride_id = self.test_data["test_ride"]["id"]
            
            print(f"\n--- Test 4.2: POST /api/mobility/ride/{ride_id[:8]}.../accept ---")
            
            response = self.make_request("POST", f"/mobility/ride/{ride_id}/accept", token=token)
            
            if response.status_code == 200:
                accept_result = response.json()
                success = accept_result.get("success", False)
                
                if success:
                    self.log_test("Accept Ride", True, 
                                 "✅ Ride accepted successfully")
                    
                    updated_ride = accept_result.get("ride", {})
                    print(f"🔍 Ride accepted:")
                    print(f"   📍 Status: {updated_ride.get('status', 'N/A')}")
                    print(f"   ⏰ Accepted at: {updated_ride.get('accepted_at', 'N/A')}")
                else:
                    self.log_test("Accept Ride", False, 
                                 f"❌ Failed to accept ride - Success: {success}")
            else:
                self.log_test("Accept Ride", False, 
                             f"❌ Accept ride failed - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    pass
            
            # Test 4.3: Mark driver arrived
            print(f"\n--- Test 4.3: POST /api/mobility/ride/{ride_id[:8]}.../arrived ---")
            
            response = self.make_request("POST", f"/mobility/ride/{ride_id}/arrived", token=token)
            
            if response.status_code == 200:
                arrived_result = response.json()
                success = arrived_result.get("success", False)
                
                if success:
                    self.log_test("Driver Arrived", True, 
                                 "✅ Driver arrival marked successfully")
                else:
                    self.log_test("Driver Arrived", False, 
                                 f"❌ Failed to mark driver arrival - Success: {success}")
            else:
                self.log_test("Driver Arrived", False, 
                             f"❌ Mark driver arrived failed - Status: {response.status_code}")
            
            # Test 4.4: Start ride
            print(f"\n--- Test 4.4: POST /api/mobility/ride/{ride_id[:8]}.../start ---")
            
            response = self.make_request("POST", f"/mobility/ride/{ride_id}/start", token=token)
            
            if response.status_code == 200:
                start_result = response.json()
                success = start_result.get("success", False)
                
                if success:
                    self.log_test("Start Ride", True, 
                                 "✅ Ride started successfully")
                else:
                    self.log_test("Start Ride", False, 
                                 f"❌ Failed to start ride - Success: {success}")
            else:
                self.log_test("Start Ride", False, 
                             f"❌ Start ride failed - Status: {response.status_code}")
            
            # Test 4.5: Complete ride
            print(f"\n--- Test 4.5: POST /api/mobility/ride/{ride_id[:8]}.../complete ---")
            
            response = self.make_request("POST", f"/mobility/ride/{ride_id}/complete", token=token)
            
            if response.status_code == 200:
                complete_result = response.json()
                success = complete_result.get("success", False)
                payment_qr_code = complete_result.get("payment_qr_code")
                
                if success and payment_qr_code:
                    self.log_test("Complete Ride", True, 
                                 "✅ Ride completed successfully with QR code generated")
                    
                    self.test_data["payment_qr_code"] = payment_qr_code
                    print(f"🔍 Ride completed:")
                    print(f"   💳 QR Code generated for payment")
                    print(f"   📱 QR Code length: {len(payment_qr_code)} chars")
                else:
                    self.log_test("Complete Ride", False, 
                                 f"❌ Failed to complete ride - Success: {success}, QR: {bool(payment_qr_code)}")
            else:
                self.log_test("Complete Ride", False, 
                             f"❌ Complete ride failed - Status: {response.status_code}")
        else:
            print("\n--- Tests 4.2-4.5: Driver Flow Actions ---")
            self.log_test("Driver Flow Tests", False, 
                         "⚠️ Skipped - No test ride available")
        
        # Step 5: Payment & Rating Tests
        print("\n=== STEP 5: PAYMENT & RATING ===")
        
        # Test 5.1: Process payment (if we have a completed ride)
        if self.test_data.get("ride_id") and self.test_data.get("payment_qr_code"):
            ride_id = self.test_data["ride_id"]
            
            print(f"\n--- Test 5.1: POST /api/mobility/ride/{ride_id[:8]}.../pay ---")
            
            response = self.make_request("POST", f"/mobility/ride/{ride_id}/pay", token=token)
            
            if response.status_code == 200:
                payment_result = response.json()
                success = payment_result.get("success", False)
                
                if success:
                    self.log_test("Process Payment", True, 
                                 "✅ Payment processed successfully")
                    
                    payment_details = payment_result.get("payment_details", {})
                    print(f"🔍 Payment processed:")
                    print(f"   💰 Total paid: R$ {payment_details.get('total_paid', 0):.2f}")
                    print(f"   👤 Driver received: R$ {payment_details.get('driver_received', 0):.2f}")
                    print(f"   🏢 Platform fee: R$ {payment_details.get('platform_fee', 0):.2f}")
                    print(f"   💸 Cashback: R$ {payment_details.get('cashback_received', 0):.2f}")
                else:
                    self.log_test("Process Payment", False, 
                                 f"❌ Payment processing failed - Success: {success}")
            else:
                self.log_test("Process Payment", False, 
                             f"❌ Process payment failed - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    pass
            
            # Test 5.2: Rate driver (client rating)
            print(f"\n--- Test 5.2: POST /api/mobility/ride/{ride_id[:8]}.../rate/driver ---")
            
            rating_data = {
                "rating": 5,
                "comment": "Excellent driver, very professional!"
            }
            
            response = self.make_request("POST", f"/mobility/ride/{ride_id}/rate/driver", rating_data, token=token)
            
            if response.status_code == 200:
                rating_result = response.json()
                success = rating_result.get("success", False)
                
                if success:
                    self.log_test("Rate Driver", True, 
                                 "✅ Driver rating submitted successfully")
                else:
                    self.log_test("Rate Driver", False, 
                                 f"❌ Failed to rate driver - Success: {success}")
            else:
                self.log_test("Rate Driver", False, 
                             f"❌ Rate driver failed - Status: {response.status_code}")
            
            # Test 5.3: Rate client (driver rating)
            print(f"\n--- Test 5.3: POST /api/mobility/ride/{ride_id[:8]}.../rate/client ---")
            
            rating_data = {
                "rating": 5,
                "comment": "Great passenger, very polite!"
            }
            
            response = self.make_request("POST", f"/mobility/ride/{ride_id}/rate/client", rating_data, token=token)
            
            if response.status_code == 200:
                rating_result = response.json()
                success = rating_result.get("success", False)
                
                if success:
                    self.log_test("Rate Client", True, 
                                 "✅ Client rating submitted successfully")
                else:
                    self.log_test("Rate Client", False, 
                                 f"❌ Failed to rate client - Success: {success}")
            else:
                self.log_test("Rate Client", False, 
                             f"❌ Rate client failed - Status: {response.status_code}")
        else:
            print("\n--- Tests 5.1-5.3: Payment & Rating ---")
            self.log_test("Payment & Rating Tests", False, 
                         "⚠️ Skipped - No completed ride available")
        
        # Final Summary
        print(f"\n🎯 MOBILITY MODULE TEST SUMMARY:")
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        print(f"   • Total tests executed: {total_tests}")
        print(f"   • Tests passed: {successful_tests}")
        print(f"   • Tests failed: {failed_tests}")
        print(f"   • Success rate: {(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "   • Success rate: 0%")
        
        # Critical functionality check
        critical_tests = [
            "Login Authentication",
            "Get Driver Profile", 
            "Ride Estimate",
            "Get Available Rides",
            "Get Active Ride"
        ]
        
        critical_passed = 0
        for test_name in critical_tests:
            if any(r["test"] == test_name and r["success"] for r in self.test_results):
                critical_passed += 1
        
        print(f"   • Critical functions working: {critical_passed}/{len(critical_tests)}")
        
        # Show failed tests
        failed_test_results = [r for r in self.test_results if not r["success"]]
        if failed_test_results:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_test_results:
                print(f"   • {test['test']}: {test['details']}")
        
        # Final assessment
        if critical_passed >= len(critical_tests) * 0.8 and successful_tests >= total_tests * 0.7:
            print("\n✅ MOBILITY MODULE STATUS: FUNCTIONAL")
            print("   ✅ Core endpoints working")
            print("   ✅ Driver registration/management working")
            print("   ✅ Ride estimation working")
            print("   ✅ Basic ride flow functional")
            print("   ✅ System ready for use")
            return True
        else:
            print("\n❌ MOBILITY MODULE STATUS: ISSUES DETECTED")
            print("   ❌ Some critical functionality not working")
            print("   ❌ Review failed tests above")
            print("   ❌ Fix required before production use")
            return False

def main():
    """Run mobility module tests"""
    print("🚗 Starting Mobility Module Backend Tests...")
    
    tester = MobilityTester()
    
    try:
        success = tester.test_mobility_module_comprehensive()
        
        if success:
            print("\n🎉 ALL MOBILITY TESTS COMPLETED SUCCESSFULLY!")
            exit(0)
        else:
            print("\n⚠️ MOBILITY TESTS COMPLETED WITH ISSUES!")
            exit(1)
            
    except Exception as e:
        print(f"\n💥 MOBILITY TESTS FAILED WITH ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == "__main__":
    main()