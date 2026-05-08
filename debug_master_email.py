#!/usr/bin/env python3
"""
Debug master account email encoding
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def debug_master_email():
    """Debug master account email encoding"""
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitocoin')
    db = client[db_name]
    
    print("🔍 DEBUGGING MASTER ACCOUNT EMAIL")
    print("=" * 50)
    
    # Find the master account by is_master_account flag
    master_account = await db.users.find_one({"is_master_account": True})
    
    if master_account:
        email = master_account.get('email', '')
        print(f"📧 Email found: '{email}'")
        print(f"📏 Email length: {len(email)}")
        print(f"🔤 Email bytes: {email.encode('utf-8')}")
        print(f"🔤 Email repr: {repr(email)}")
        
        # Check each character
        print("\n🔍 Character analysis:")
        for i, char in enumerate(email):
            print(f"  [{i}] '{char}' (ord: {ord(char)})")
        
        # Try to clean the email
        clean_email = email.strip()
        print(f"\n🧹 Cleaned email: '{clean_email}'")
        print(f"📏 Cleaned length: {len(clean_email)}")
        
        # Update with clean email
        if clean_email != email:
            print("\n🔧 Updating email to clean version...")
            result = await db.users.update_one(
                {"is_master_account": True},
                {"$set": {"email": clean_email}}
            )
            if result.modified_count > 0:
                print("✅ Email updated successfully")
            else:
                print("❌ Email update failed")
        
        # Test login with the actual email from database
        print(f"\n🔐 Testing login with database email...")
        import requests
        
        login_data = {
            "email": clean_email,
            "password": "master123"
        }
        
        try:
            response = requests.post("http://localhost:8001/api/auth/login", json=login_data)
            print(f"🌐 Login response: {response.status_code}")
            if response.status_code == 200:
                print("✅ Login successful with database email")
            else:
                print(f"❌ Login failed: {response.text}")
        except Exception as e:
            print(f"❌ Login request failed: {e}")
    
    else:
        print("❌ No master account found with is_master_account=True")

if __name__ == "__main__":
    asyncio.run(debug_master_email())